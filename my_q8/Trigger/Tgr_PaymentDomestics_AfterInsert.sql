/*
国内费用
*/
delimiter $
drop trigger if exists Tgr_PaymentDomestics_AfterInsert $
create trigger Tgr_PaymentDomestics_AfterInsert after insert
on PaymentDomestics 
for each row
begin
    /*定义变量*/
    declare sNewID varchar(255);
    set sNewID=new.ID;
    call Proc_ApplyForPayments_PaymentDomestics_UnPaiedAmount(sNewID);-- 付款申请-国内费用
end$
delimiter ;