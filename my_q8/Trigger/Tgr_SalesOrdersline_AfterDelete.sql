/*
销售合同-产品资料
*/
delimiter $
drop trigger if exists Tgr_SalesOrdersline_AftereDelete $
create trigger Tgr_SalesOrdersline_AftereDelete after delete
on SalesOrdersline 
for each row
begin
    /*定义变量*/
    declare sItemNo varchar(255); 
    set sItemNo=old.ItemNo;
    call Proc_Items_LastTradedDate(sItemNo);-- 产品资料-最近成交  
    call Proc_Items_SumTotalTotalTurnover(sItemNo);-- 产品资料-成交总额
    call Proc_Items_SumTotalTransactions(sItemNo);-- 产品资料-成交总量
end$
/*恢复结束符为;*/
delimiter ;