/*
看板-销售趋势-产品
*/
delimiter $ 
drop procedure if exists Proc_Board_SalesTrends_Product $
create procedure Proc_Board_SalesTrends_Product()
begin
    declare iRows int;
    declare sUnit varchar(10);
    declare sDate datetime;
    declare eDate datetime;
    /*建内存表*/
    create TABLE if not exists Board_SalesTrends_Product (
            dUpdateTime datetime,
            sSeries varchar(255),
            sCategories varchar(255),
            fValue decimal(18,2)); 
    truncate TABLE Board_SalesTrends_Product;  -- 使用前先清空内存表。
    -- 新建日期 
    set sDate=(ifNull((Select OrderDate From SalesOrders Where SalesOrderStatus NOT IN ('待确认', '已作废') Order By OrderDate Asc Limit 0,1),concat(curdate(),' 00:00:00')));
    set eDate=(ifNull((Select OrderDate From SalesOrders Where SalesOrderStatus NOT IN ('待确认', '已作废') Order By OrderDate Desc Limit 0,1),concat(LAST_DAY(curdate()),' 23:59:59')));
    set iRows=(Select PERIOD_DIFF(DATE_FORMAT(eDate,'%Y%m'),DATE_FORMAT(sDate,'%Y%m'))); -- 两日期相减得到月数
    -- <循环创建虚拟表记录begin>
    begin
        declare sClassification varchar(255);
        declare j int default 1;
        /*定义结束标志变量*/
        declare Done int default 0;
        /*定义游标 以及赋值*/
        declare Cursor_Board_SalesTrends_Product cursor for 
            Select
            ifNull(
                sys_module_catalogue.name, '未定义'
            ) AS sClassification
            From
            SalesOrdersline
            Left Join SalesOrders
                On SalesOrders.rid = SalesOrdersline.pid
            Left Join Items
                On Items.ItemNo = SalesOrdersline.ItemNo
            Left Join sys_module_catalogue
                On sys_module_catalogue.rid = Items.cat_id
            Where SalesOrders.OrderDate >= sDate
            AND SalesOrders.OrderDate <= eDate
            AND SalesOrders.SalesOrderStatus NOT IN ('待确认', '已作废')
            Group By sys_module_catalogue.name;
        /*指定游标循环结束时的返回值 */
        declare continue handler for not found set Done =1; 
        /*打开游标*/
        open Cursor_Board_SalesTrends_Product;
        /*循环开始*/
        flag_loop_Board_SalesTrends_Product:loop
        /*给游标变量赋值*/
        fetch Cursor_Board_SalesTrends_Product into sClassification; 
        /*判断游标的循环是否结束*/
        if Done then 
            leave flag_loop_Board_SalesTrends_Product ; 
        end if ;
        set j=0;
        while(j<=iRows) do   
            Insert Into Board_SalesTrends_Product (dUpdateTime,sSeries,sCategories,fValue) values (now(),sClassification,DATE_FORMAT(DATE_ADD(sDate,INTERVAL j MONTH),'%Y-%m'),0);
            set j = j+1;  
        end while; 
        end loop;  /*循环结束*/
        close Cursor_Board_SalesTrends_Product;/*关闭游标*/
    end;
    -- <循环创建虚拟表记录end>
    
    -- 归类数据并填充
    update Board_SalesTrends_Product set fValue=ifnull((
            Select
            Sum(SalesOrdersline.ConvertUSD) as ConvertUSD
            From
            SalesOrdersline
            Left Join SalesOrders
                On SalesOrders.rid = SalesOrdersline.pid
            Left Join Items
                On Items.ItemNo = SalesOrdersline.ItemNo
            Left Join sys_module_catalogue
                On sys_module_catalogue.rid = Items.cat_id
            Where SalesOrders.OrderDate >= sDate
            AND SalesOrders.OrderDate <= eDate
            AND SalesOrders.SalesOrderStatus NOT IN ('待确认', '已作废')
            And sCategories = convert(DATE_FORMAT(SalesOrders.OrderDate, '%Y-%m'), char)
            And sSeries = sys_module_catalogue.name
            And sys_module_catalogue.name is not Null
            And sys_module_catalogue.name<>''
            Group By sys_module_catalogue.name,convert(DATE_FORMAT(SalesOrders.OrderDate, '%Y-%m'), char)),0);
end $ 
delimiter ;