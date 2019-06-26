/*
公海机制计算预计释放日期
*/
delimiter $ 
drop procedure if exists Proc_Customers_RemovalDate $
create procedure Proc_Customers_RemovalDate()
begin
    /*定义变量*/
    declare dCreated date;
    declare iRetentionTime int;
    declare sRecordID varchar(255); 
    /*定义结束标志变量*/
    declare Done int default 0;
    /*定义游标 以及赋值*/
    declare Cursor_Customers_RemovalDate cursor for 
    SELECT
        rid,
        T.RetentionTime,
        DATE_FORMAT( CTime, '%Y-%m-%d' ) AS FCreated 
        FROM
        Customers
        LEFT JOIN ( SELECT CustomerClass, RetentionTime FROM Dic_CustomerClass ) T ON Customers.CustomerClass = T.CustomerClass 
        WHERE
        LastTradedDate IS NULL 
        OR LastTradedDate = '';
    /*指定游标循环结束时的返回值 */
    declare continue handler for not found set Done =1; 
    /*打开游标*/
    open Cursor_Customers_RemovalDate;
    /*循环开始*/
    flag_loop:loop
    /*给游标变量赋值*/
    fetch Cursor_Customers_RemovalDate into sRecordID,iRetentionTime,dCreated; 
    /*判断游标的循环是否结束*/
    if Done then 
        leave flag_loop ; 
    end if ;
        Update Customers
            Set    RemovalDate = date_add(dCreated, interval iRetentionTime day)
            Where  rid = sRecordID;
    end loop;  /*循环结束*/
    close Cursor_Customers_RemovalDate;/*关闭游标*/
end $ 
delimiter ;