/*
国内费用
*/
delimiter $
drop trigger if exists Tgr_PaymentDomestics_AfterDelete $
create trigger Tgr_PaymentDomestics_AfterDelete after delete
on PaymentDomestics 
for each row
begin
    /*定义变量*/
    declare sOldID varchar(255);
    set sOldID=old.ID;
    call Proc_ApplyForPayments_PaymentDomestics_UnPaiedAmount(sOldID);-- 付款申请-国内费用
end$
delimiter ;