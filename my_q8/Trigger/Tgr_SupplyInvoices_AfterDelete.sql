/*
收票管理
*/
delimiter $
drop trigger if exists Tgr_SupplyInvoices_AfterDelete $
create trigger Tgr_SupplyInvoices_AfterDelete after delete
on SupplyInvoices 
for each row
begin
    call Proc_BillNotifies_SumBilledAmount(old.BillNotifyNo);
end$
delimiter ;