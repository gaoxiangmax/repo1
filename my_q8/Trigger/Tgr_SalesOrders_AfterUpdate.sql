/*
销售合同
*/
delimiter $
drop trigger if exists Tgr_SalesOrders_AftereUpdate $
create trigger Tgr_SalesOrders_AftereUpdate after update
on SalesOrders 
for each row
begin
    /*定义变量*/
    declare srid varchar(255);
    declare sNewCustomerNo varchar(255); 
    declare sOldCustomerNo varchar(255); 
    declare dNewDate date;
    declare dOldDate date;
    set srid=new.rid;
    set sNewCustomerNo=new.CustomerNo;
    set sOldCustomerNo=old.CustomerNo;
    set dNewDate=new.OrderDate;
    set dOldDate=old.OrderDate;
    if ifNull(dNewDate,'') <> ifNull(dOldDate,'') or ifNull(sNewCustomerNo,'')<>ifNull(sOldCustomerNo,'') then
        call Proc_Customers_LastTradedDate(sNewCustomerNo);-- 客户资料-最近成交
        call Proc_SalesOrders_SumTotalSales(sNewCustomerNo);-- 客户资料-销售总额  

        call Proc_Customers_LastTradedDate(sOldCustomerNo);-- 客户资料-最近成交 
        call Proc_SalesOrders_SumTotalSales(sOldCustomerNo);-- 客户资料-销售总额  
    end if;

    if ifNull(dNewDate,'') <> ifNull(dOldDate,'') then 
        begin
            /*定义变量*/
            declare sItemNo varchar(255); 
            /*定义结束标志变量*/
            declare Done int default 0;
            /*定义游标 以及赋值*/
            declare Cursor_SalesOrders_AftereUpdate_SalesOrdersLine cursor for 
            Select ItemNo From SalesOrdersline Where pid=srid;
            /*指定游标循环结束时的返回值 */
            declare continue handler for not found set Done =1; 
            /*打开游标*/
            open Cursor_SalesOrders_AftereUpdate_SalesOrdersLine;
            /*循环开始*/
            flag_loop_SalesOrdersLine:loop
            /*给游标变量赋值*/
            fetch Cursor_SalesOrders_AftereUpdate_SalesOrdersLine into sItemNo; 
            /*判断游标的循环是否结束*/
            if Done then 
                leave flag_loop_SalesOrdersLine ; 
            end if ;
            call Proc_Items_LastTradedDate2(sItemNo);-- 产品资料-最近成交 
            end loop;  /*循环结束*/
            close Cursor_SalesOrders_AftereUpdate_SalesOrdersLine;/*关闭游标*/
        end;
    end if;
end$
/*恢复结束符为;*/
delimiter ;