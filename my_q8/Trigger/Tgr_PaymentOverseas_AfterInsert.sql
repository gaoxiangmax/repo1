/*
国外费用
*/
delimiter $
drop trigger if exists Tgr_PaymentOverseas_AfterInsert $
create trigger Tgr_PaymentOverseas_AfterInsert after insert
on PaymentOverseas 
for each row
begin
    /*定义变量*/
    declare sNewID varchar(255);
    set sNewID=new.ID;
    call Proc_ApplyForPayments_PaymentOverseas_UnPaiedAmount(sNewID);-- 付款申请-国外费用
end$
delimiter ;