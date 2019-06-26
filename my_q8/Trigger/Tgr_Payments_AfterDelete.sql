/*
工厂付款
*/
delimiter $
drop trigger if exists Tgr_Payments_AfterDelete $
create trigger Tgr_Payments_AfterDelete after delete
on Payments
for each row
begin
    /*定义变量*/
    declare sOldID varchar(255);
    set sOldID=old.ID;
    call Proc_ApplyForPayments_Payments_UnPaiedAmount(sOldID);-- 付款申请-工厂付款 
end$
delimiter ;