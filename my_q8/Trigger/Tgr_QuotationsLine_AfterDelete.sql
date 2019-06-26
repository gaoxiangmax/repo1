/*
客户报价-产品资料
*/
delimiter $
drop trigger if exists Tgr_QuotationsLine_AftereDelete $
create trigger Tgr_QuotationsLine_AftereDelete after delete
on QuotationsLine 
for each row
begin
    call Proc_Items_LastQuotation(old.ItemNo);-- 客户资料-最近成交 
end$
/*恢复结束符为;*/
delimiter ;