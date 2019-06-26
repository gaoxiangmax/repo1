/*
客户寄样
*/
delimiter $
drop trigger if exists Tgr_SendSamples_AftereInsert $
create trigger Tgr_SendSamples_AftereInsert after insert
on SendSamples 
for each row
begin
    call Proc_Customers_LastSend(new.PartnerNo);-- 客户资料-最近寄样 
end$
/*恢复结束符为;*/
delimiter ;