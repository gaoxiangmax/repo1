/*
销售合同
*/
delimiter $
drop trigger if exists Tgr_SalesOrders_AftereDelete $
create trigger Tgr_SalesOrders_AftereDelete after delete
on SalesOrders 
for each row
begin
    /*定义变量*/
    declare sCustomerNo varchar(255); 
    set sCustomerNo=old.CustomerNo;
    call Proc_Customers_LastTradedDate(sCustomerNo);-- 客户资料-最近成交 
    call Proc_SalesOrders_SumTotalSales(sCustomerNo);-- 客户资料-销售总额 
end$
/*恢复结束符为;*/
delimiter ;