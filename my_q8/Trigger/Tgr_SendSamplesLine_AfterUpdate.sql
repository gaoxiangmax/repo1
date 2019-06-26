/*
客户寄样-产品资料
*/
delimiter $
drop trigger if exists Tgr_SendSamplesLine_AftereUpdate $
create trigger Tgr_SendSamplesLine_AftereUpdate after update
on SendSamplesLine 
for each row
begin
    /*定义变量*/
    declare sNewItemNo varchar(255); 
    declare sOldItemNo varchar(255); 
    set sNewItemNo=new.ItemNo;
    set sOldItemNo=old.ItemNo;
    if ifNull(sNewItemNo,'')<>ifNull(sOldItemNo,'') then
        call Proc_Items_LastSend(sNewItemNo);-- 客户资料-最近寄样
        call Proc_Items_LastSend(sOldItemNo);-- 客户资料-最近寄样
    end if;
end$
/*恢复结束符为;*/
delimiter ;