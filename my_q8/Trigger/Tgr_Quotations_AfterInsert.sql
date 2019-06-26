/*
客户报价
*/
/*将结束符;改成$*/
delimiter $
drop trigger if exists Tgr_Quotations_AftereInsert $
create trigger Tgr_Quotations_AftereInsert after insert
on Quotations 
for each row
begin
    call Proc_Customers_LastQuotation(new.CustomerNo);-- 客户资料-最近报价 
end$
/*恢复结束符为;*/
delimiter ;