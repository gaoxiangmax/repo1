/*
结算中心-其它国外费用
*/
delimiter $ 
drop procedure if exists Proc_Settlements_SumOtherOverseasPaidUp2 $
create procedure Proc_Settlements_SumOtherOverseasPaidUp2(sInvoiceNO varchar(255)) 
begin
    declare fOtherOverseasPaidUp decimal(18,2);
    set fOtherOverseasPaidUp=(Select Sum(ifnull(PaymentOverseasDetail.UsedAmount,0)) as UsedAmount From PaymentOverseas,PaymentOverseasDetail
        Where PaymentOverseas.rid=PaymentOverseasDetail.pid and PaymentOverseasDetail.KeyNo=sInvoiceNO and PaymentOverseas.CostName='其它');
    Update Settlements set OtherOverseasPaidUp=ifnull(fOtherOverseasPaidUp,0) Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;