/*
结算中心-已付样品费 
*/
delimiter $ 
drop procedure if exists Proc_Settlements_SumSampleFeesPaidUp $
create procedure Proc_Settlements_SumSampleFeesPaidUp(sInvoiceNO varchar(255)) 
begin
    declare fSampleFeesPaidUp decimal(18,2);
    set fSampleFeesPaidUp=(Select Sum(ifnull(PaymentsDetail.UsedAmount,0)) as UsedAmount From PaymentsDetail,Payments
        Where PaymentsDetail.pid=Payments.rid and PaymentsDetail.InvoiceNO=sInvoiceNO and Payments.CostName='样品费');
    Update Settlements set SampleFeesPaidUp=ifnull(fSampleFeesPaidUp,0) Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;