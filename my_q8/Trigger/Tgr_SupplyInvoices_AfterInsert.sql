/*
收票管理
*/
delimiter $
drop trigger if exists Tgr_SupplyInvoices_AfterInsert $
create trigger Tgr_SupplyInvoices_AfterInsert after insert
on SupplyInvoices 
for each row
begin
    call Proc_BillNotifies_SumBilledAmount(new.BillNotifyNo);
end$
delimiter ;