/*
看板-出货趋势-部门
*/
delimiter $ 
drop procedure if exists Proc_Board_ShipmentsTrends_Department $
create procedure Proc_Board_ShipmentsTrends_Department()
begin
    declare iRows int;
    declare sUnit varchar(10);
    declare sDate datetime;
    declare eDate datetime;
    /*建内存表*/
    create TABLE if not exists Board_ShipmentsTrends_Department (
            dUpdateTime datetime,
            sSeries varchar(255),
            sCategories varchar(255),
            fValue decimal(18,2)); 
    truncate TABLE Board_ShipmentsTrends_Department;  -- 使用前先清空内存表。
    -- 新建日期 
    set sDate=(ifNull((Select ShippingDate From Shipments Where ShipmentStatus NOT IN ('待确认', '已作废') Order By ShippingDate Asc Limit 0,1),concat(curdate(),' 00:00:00')));
    set eDate=(ifNull((Select ShippingDate From Shipments Where ShipmentStatus NOT IN ('待确认', '已作废') Order By ShippingDate Desc Limit 0,1),concat(LAST_DAY(curdate()),' 23:59:59')));
    set iRows=(Select PERIOD_DIFF(DATE_FORMAT(eDate,'%Y%m'),DATE_FORMAT(sDate,'%Y%m')));
    -- <循环创建虚拟表记录begin>
    begin
        declare sDepartment varchar(255);
        declare j int default 1;
        /*定义结束标志变量*/
        declare Done int default 0;
        /*定义游标 以及赋值*/
        declare Cursor_Board_ShipmentsTrends_Department cursor for 
            SELECT
            ifnull( Dic_Sales.Department, '未分类' ) AS AName
            FROM
            Shipments
            Left Join Dic_Sales On Dic_Sales.SalesMan=Shipments.Salesman
            WHERE
            ShippingDate >= sDate
            AND ShippingDate <= eDate AND ShipmentStatus NOT IN ( '待确认', '已作废' ) AND TotalAmount > 0 
            GROUP BY
            Dic_Sales.Department; 
        /*指定游标循环结束时的返回值 */
        declare continue handler for not found set Done =1; 
        /*打开游标*/
        open Cursor_Board_ShipmentsTrends_Department;
        /*循环开始*/
        flag_loop_Board_ShipmentsTrends_Department:loop
        /*给游标变量赋值*/
        fetch Cursor_Board_ShipmentsTrends_Department into sDepartment; 
        /*判断游标的循环是否结束*/
        if Done then 
            leave flag_loop_Board_ShipmentsTrends_Department ; 
        end if ;
        set j=0;
        while(j<=iRows) do   
            Insert Into Board_ShipmentsTrends_Department (dUpdateTime,sSeries,sCategories,fValue) values (now(),sDepartment,DATE_FORMAT(DATE_ADD(sDate,INTERVAL j MONTH),'%Y-%m'),0);
            set j = j+1;  
        end while; 
        end loop;  /*循环结束*/
        close Cursor_Board_ShipmentsTrends_Department;/*关闭游标*/
    end;
    -- <循环创建虚拟表记录end>
    
    -- 归类数据并填充
    update Board_ShipmentsTrends_Department set fValue=ifnull((
            SELECT
            SUM(Shipments.TotalAmount * ifNull((Select Rate From Dic_Currency Where CurrencyCode='USD' Limit 0,1),1)) AS TotalAmount
            FROM
            Shipments
            Left Join Dic_Sales
                On Dic_Sales.SalesMan = Shipments.Salesman
            Where Shipments.ShippingDate >= sDate
            AND Shipments.ShippingDate <= eDate
            AND Shipments.ShipmentStatus NOT IN ('待确认', '已作废')
            And sCategories = convert(
                DATE_FORMAT(Shipments.ShippingDate, '%Y-%m'), char
            )
            And sSeries = Dic_Sales.Department
            And Dic_Sales.Department is not Null
            And Dic_Sales.Department <> ''
            Group By Dic_Sales.Department, convert(
                DATE_FORMAT(
                Shipments.ShippingDate, '%Y-%m'
                ), char
            )),0);
end $ 
delimiter ;