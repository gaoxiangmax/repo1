/*
收票管理
*/
delimiter $
drop trigger if exists Tgr_SupplyInvoices_AfterUpdate $
create trigger Tgr_SupplyInvoices_AfterUpdate after update
on SupplyInvoices 
for each row
begin
    if (ifnull(new.BillNotifyNo,'')<>ifnull(old.BillNotifyNo,'')) or (new.TotalBilledAmount <> old.TotalBilledAmount) then
        call Proc_BillNotifies_SumBilledAmount(new.BillNotifyNo);
        call Proc_BillNotifies_SumBilledAmount(old.BillNotifyNo);
    end if; 
end$
delimiter ;