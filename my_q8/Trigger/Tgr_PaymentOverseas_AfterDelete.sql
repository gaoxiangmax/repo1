/*
国外费用
*/
delimiter $
drop trigger if exists Tgr_PaymentOverseas_AfterDelete $
create trigger Tgr_PaymentOverseas_AfterDelete after delete
on PaymentOverseas 
for each row
begin
    /*定义变量*/
    declare sOldID varchar(255);
    set sOldID=old.ID;
    call Proc_ApplyForPayments_PaymentOverseas_UnPaiedAmount(sOldID);-- 付款申请-国外费用
end$
delimiter ;