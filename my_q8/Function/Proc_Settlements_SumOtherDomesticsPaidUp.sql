/*
结算中心-其它国内费用
*/
delimiter $ 
drop procedure if exists Proc_Settlements_SumOtherDomesticsPaidUp $
create procedure Proc_Settlements_SumOtherDomesticsPaidUp(sInvoiceNO varchar(255)) 
begin
    declare fOtherDomesticsPaidUp decimal(18,2);
    set fOtherDomesticsPaidUp=(Select Sum(ifnull(PaymentDomesticsDetail.UsedAmount,0)) as UsedAmount From PaymentDomestics,PaymentDomesticsDetail
        Where PaymentDomestics.rid=PaymentDomesticsDetail.pid and PaymentDomesticsDetail.KeyNo=sInvoiceNO and PaymentDomestics.CostName='其它');
    Update Settlements set OtherDomesticsPaidUp=ifnull(fOtherDomesticsPaidUp,0) Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;