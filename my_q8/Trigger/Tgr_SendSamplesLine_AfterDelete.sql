/*
客户寄样-产品资料
*/
delimiter $
drop trigger if exists Tgr_SendSamplesLine_AftereDelete $
create trigger Tgr_SendSamplesLine_AftereDelete after delete
on SendSamplesLine 
for each row
begin
    call Proc_Items_LastSend(old.ItemNo);-- 客户资料-最近寄样
end$
/*恢复结束符为;*/
delimiter ;