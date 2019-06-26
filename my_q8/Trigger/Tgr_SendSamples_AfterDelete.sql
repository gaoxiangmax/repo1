/*
客户寄样
*/
delimiter $
drop trigger if exists Tgr_SendSamples_AftereDelete $
create trigger Tgr_SendSamples_AftereDelete after delete
on SendSamples 
for each row
begin
    call Proc_Customers_LastSend(old.PartnerNo);-- 客户资料-最近寄样 
end$
/*恢复结束符为;*/
delimiter ;