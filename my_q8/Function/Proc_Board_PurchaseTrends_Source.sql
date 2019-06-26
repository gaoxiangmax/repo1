/*
看板-采购趋势-厂商来源
*/
delimiter $ 
drop procedure if exists Proc_Board_PurchaseTrends_Source $
create procedure Proc_Board_PurchaseTrends_Source()
begin
    declare iRows int;
    declare sUnit varchar(10);
    declare sDate datetime;
    declare eDate datetime;
    /*建内存表*/
    create TABLE if not exists Board_PurchaseTrends_Source (
            dUpdateTime datetime,
            sSeries varchar(255),
            sCategories varchar(255),
            fValue decimal(18,2)); 
        truncate TABLE Board_PurchaseTrends_Source;  -- 使用前先清空内存表。
        -- 新建日期 
        set sDate=(ifNull((Select OrderDate From PurchaseOrders Where PurchaseOrderStatus NOT IN ('待确认', '已作废') Order By OrderDate Asc Limit 0,1),concat(curdate(),' 00:00:00')));
        set eDate=(ifNull((Select OrderDate From PurchaseOrders Where PurchaseOrderStatus NOT IN ('待确认', '已作废') Order By OrderDate Desc Limit 0,1),concat(LAST_DAY(curdate()),' 23:59:59')));
        set iRows=(Select PERIOD_DIFF(DATE_FORMAT(eDate,'%Y%m'),DATE_FORMAT(sDate,'%Y%m'))); -- 两日期相减得到月数
        -- <循环创建虚拟表记录begin>
        begin
            declare sSource varchar(200);
            declare j int default 1;
            /*定义结束标志变量*/
            declare Done int default 0;
            /*定义游标 以及赋值*/
            declare Cursor_Board_PurchaseTrends_Source cursor for 
                Select
                ifNull(
                    Suppliers.Source, '未定义'
                ) AS sSource
                From
                PurchaseOrders
                Left Join Suppliers
                    On Suppliers.SupplierNo = PurchaseOrders.SupplierNo
                Where PurchaseOrders.OrderDate >= sDate
                AND PurchaseOrders.OrderDate <= eDate
                AND PurchaseOrders.PurchaseOrderStatus NOT IN ('待确认', '已作废')
                Group By Suppliers.Source;
            /*指定游标循环结束时的返回值 */
            declare continue handler for not found set Done =1; 
            /*打开游标*/
            open Cursor_Board_PurchaseTrends_Source;
            /*循环开始*/
            flag_loop_Board_PurchaseTrends_Source:loop
            /*给游标变量赋值*/
            fetch Cursor_Board_PurchaseTrends_Source into sSource; 
            /*判断游标的循环是否结束*/
            if Done then 
                leave flag_loop_Board_PurchaseTrends_Source ; 
            end if ;
            set j=0;
            while(j<=iRows) do   
                Insert Into Board_PurchaseTrends_Source (dUpdateTime,sSeries,sCategories,fValue) values (now(),sSource,DATE_FORMAT(DATE_ADD(sDate,INTERVAL j MONTH),'%Y-%m'),0);
                set j = j+1;  
            end while; 
            end loop;  /*循环结束*/
            close Cursor_Board_PurchaseTrends_Source;/*关闭游标*/
        end;
        -- <循环创建虚拟表记录end>
        
        -- 归类数据并填充
        update Board_PurchaseTrends_Source set fValue=ifnull((
                Select
                round(SUM(TotalOrderAmount * ifNull((Select Rate From Dic_Currency Where CurrencyCode=PurchaseOrders.PurchaseCurrency Limit 0,1),1)),2) as Amount 
                From
                PurchaseOrders
                Left Join Suppliers
                    On Suppliers.SupplierNo = PurchaseOrders.SupplierNo
                Where PurchaseOrders.OrderDate >= sDate
                AND PurchaseOrders.OrderDate <= eDate
                AND PurchaseOrders.PurchaseOrderStatus NOT IN ('待确认', '已作废')
                And sCategories = convert(DATE_FORMAT(PurchaseOrders.OrderDate, '%Y-%m'), char)
                And sSeries = Suppliers.Source
                And Suppliers.Source is not Null
                And Suppliers.Source<>''
                Group By Suppliers.Source,convert(DATE_FORMAT(PurchaseOrders.OrderDate, '%Y-%m'), char)),0);
end $ 
delimiter ;