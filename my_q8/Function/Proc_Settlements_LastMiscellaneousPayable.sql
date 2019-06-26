/*
结算中心-应付运杂费,未付运杂费
*/
delimiter $ 
drop procedure if exists Proc_Settlements_LastMiscellaneousPayable $
create procedure Proc_Settlements_LastMiscellaneousPayable(sInvoiceNO varchar(255)) 
begin
    declare fMiscellaneousPayable decimal(18,2);
    set fMiscellaneousPayable=(Select ifnull(Miscellaneous,0) From Shipments
        Where InvoiceNo=sInvoiceNO Limit 0,1);
    Update Settlements set MiscellaneousPayable=fMiscellaneousPayable,MiscellaneousRemain=(fMiscellaneousPayable-ifnull(MiscellaneousPaidUp,0)) Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;