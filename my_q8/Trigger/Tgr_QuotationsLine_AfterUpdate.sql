/*
客户报价-产品资料
*/
delimiter $
drop trigger if exists Tgr_QuotationsLine_AftereUpdate $
create trigger Tgr_QuotationsLine_AftereUpdate after update
on QuotationsLine 
for each row
begin
    /*定义变量*/
    declare sNewItemNo varchar(255); 
    declare sOldItemNo varchar(255); 
    set sNewItemNo=new.ItemNo;
    set sOldItemNo=old.ItemNo;
    if ifNull(sNewItemNo,'')<>ifNull(sOldItemNo,'') then
        call Proc_Items_LastQuotation(sNewItemNo);-- 客户资料-最近成交 
        call Proc_Items_LastQuotation(sOldItemNo);-- 客户资料-最近成交
    end if;
end$
/*恢复结束符为;*/
delimiter ;