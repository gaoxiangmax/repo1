/*
结算中心-已付运杂费,未付运杂费
*/
delimiter $ 
drop procedure if exists Proc_Settlements_SumMiscellaneousPaidUp $
create procedure Proc_Settlements_SumMiscellaneousPaidUp(sInvoiceNO varchar(255)) 
begin
    declare fMiscellaneousPaidUp decimal(18,2);
    set fMiscellaneousPaidUp=(Select Sum(ifnull(PaymentDomesticsDetail.UsedAmount,0)) as UsedAmount From PaymentDomestics,PaymentDomesticsDetail
        Where PaymentDomestics.rid=PaymentDomesticsDetail.pid and PaymentDomesticsDetail.KeyNo=sInvoiceNO and PaymentDomestics.CostName='运杂费');
    Update Settlements set MiscellaneousPaidUp=ifnull(fMiscellaneousPaidUp,0),MiscellaneousRemain=(ifnull(MiscellaneousPayable,0)-ifnull(fMiscellaneousPaidUp,0)) Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;