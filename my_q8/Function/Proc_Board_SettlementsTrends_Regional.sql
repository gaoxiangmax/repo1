/*
看板-财务趋势-国家区域
*/
delimiter $ 
drop procedure if exists Proc_Board_SettlementsTrends_Regional $
create procedure Proc_Board_SettlementsTrends_Regional()
begin
    declare iRows int;
    declare sUnit varchar(10);
    declare sDate datetime;
    declare eDate datetime;
    /*建内存表*/
    create TABLE if not exists Board_SettlementsTrends_Regional (
            dUpdateTime datetime,
            sSeries varchar(255),
            sCategories varchar(255),
            fValue decimal(18,2)); 
    truncate TABLE Board_SettlementsTrends_Regional;  -- 使用前先清空内存表。
    -- 新建日期 
    set sDate=(ifNull((Select CheckoutDate From Settlements Where isCheckout=1 Order By CheckoutDate Asc Limit 0,1),concat(curdate(),' 00:00:00')));
    set eDate=(ifNull((Select CheckoutDate From Settlements Where isCheckout=1 Order By CheckoutDate Desc Limit 0,1),concat(LAST_DAY(curdate()),' 23:59:59')));
    set iRows=(Select PERIOD_DIFF(DATE_FORMAT(eDate,'%Y%m'),DATE_FORMAT(sDate,'%Y%m')));
    -- <循环创建虚拟表记录begin>
    begin
        declare sRegional varchar(255);
        declare j int default 1;
        /*定义结束标志变量*/
        declare Done int default 0;
        /*定义游标 以及赋值*/
        declare Cursor_Board_SettlementsTrends_Regional cursor for 
            SELECT
            ifnull( Customers.Regional, '未分类' ) AS AName
            FROM
            Settlements
            Left Join Customers On Customers.CustomerNo=Settlements.CustomerNo
            WHERE
            CheckoutDate >= sDate
            AND CheckoutDate <= eDate AND GrossProfit > 0 
            GROUP BY
            Customers.Regional; 
        /*指定游标循环结束时的返回值 */
        declare continue handler for not found set Done =1; 
        /*打开游标*/
        open Cursor_Board_SettlementsTrends_Regional;
        /*循环开始*/
        flag_loop_Board_SettlementsTrends_Regional:loop
        /*给游标变量赋值*/
        fetch Cursor_Board_SettlementsTrends_Regional into sRegional; 
        /*判断游标的循环是否结束*/
        if Done then 
            leave flag_loop_Board_SettlementsTrends_Regional ; 
        end if ;
        set j=0;
        while(j<=iRows) do   
            Insert Into Board_SettlementsTrends_Regional (dUpdateTime,sSeries,sCategories,fValue) values (now(),sRegional,DATE_FORMAT(DATE_ADD(sDate,INTERVAL j MONTH),'%Y-%m'),0);
            set j = j+1;  
        end while; 
        end loop;  /*循环结束*/
        close Cursor_Board_SettlementsTrends_Regional;/*关闭游标*/
    end;
    -- <循环创建虚拟表记录end>
    
    -- 归类数据并填充
    update Board_SettlementsTrends_Regional set fValue=ifnull((
            SELECT
            SUM(Settlements.GrossProfit) AS TotalAmount
            FROM
            Settlements
            Left Join Customers
                On Customers.CustomerNo = Settlements.CustomerNo
            Where Settlements.CheckoutDate >= sDate
            AND Settlements.CheckoutDate <= eDate
            And sCategories = convert(
                DATE_FORMAT(Settlements.CheckoutDate, '%Y-%m'), char
            )
            And sSeries = Customers.Regional
            And Customers.Regional is not Null
            And Customers.Regional <> ''
            Group By Customers.Regional, convert(
                DATE_FORMAT(
                Settlements.CheckoutDate, '%Y-%m'
                ), char
            )),0);
end $ 
delimiter ;