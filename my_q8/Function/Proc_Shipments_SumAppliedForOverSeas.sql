/*
出运明细-已申请国外,未申请国外
*/
delimiter $ 
drop procedure if exists Proc_Shipments_SumAppliedForOverSeas $
create procedure Proc_Shipments_SumAppliedForOverSeas(sKeyNo varchar(255)) 
begin
    declare fApplyAmount decimal(18,2);
    set fApplyAmount=(Select Sum(ifnull(ApplyForPaymentsDetail.ApplyAmount,0)) as ApplyAmount From ApplyForPayments,ApplyForPaymentsDetail Where
    ApplyForPayments.rid=ApplyForPaymentsDetail.pid and ApplyForPaymentsDetail.KeyModaul='出运明细' and ApplyForPaymentsDetail.KeyNo=sKeyNo and 
    ApplyForPayments.PaymentType='国外费用');

    Update Shipments set AppliedForOverSeas=ifnull(fApplyAmount,0),UnAppliedForOverSeas=(ifnull(SeaFreight,0)+ifnull(Commission,0)+ifnull(InsuranceCosts,0)-ifnull(fApplyAmount,0))  Where 
    InvoiceNO=sKeyNo;
end $ 
delimiter ;