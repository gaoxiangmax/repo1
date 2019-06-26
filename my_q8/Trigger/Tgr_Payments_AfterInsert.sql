/*
工厂付款
*/
delimiter $
drop trigger if exists Tgr_Payments_AfterInsert $
create trigger Tgr_Payments_AfterInsert after insert
on Payments
for each row
begin
    /*定义变量*/
    declare sNewID varchar(255);
    set sNewID=new.ID;
    call Proc_ApplyForPayments_Payments_UnPaiedAmount(sNewID);-- 付款申请-工厂付款 
end$
delimiter ;