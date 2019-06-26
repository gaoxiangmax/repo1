/*
销售合同
*/
delimiter $
drop trigger if exists Tgr_SalesOrders_AftereInsert $
create trigger Tgr_SalesOrders_AftereInsert after insert
on SalesOrders 
for each row
begin
    /*定义变量*/
    declare sCustomerNo varchar(255); 
    set sCustomerNo=new.CustomerNo;
    call Proc_Customers_LastTradedDate(sCustomerNo);-- 客户资料-最近成交 
    call Proc_SalesOrders_SumTotalSales(sCustomerNo);-- 客户资料-销售总额 
end$
/*恢复结束符为;*/
delimiter ;