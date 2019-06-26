/*
出运明细-已申请国内,未申请国内
*/
delimiter $ 
drop procedure if exists Proc_Shipments_SumAppliedForDomestic2 $
create procedure Proc_Shipments_SumAppliedForDomestic2(sKeyNo varchar(255)) 
begin
    declare fApplyAmount decimal(18,2);
    set fApplyAmount=(Select Sum(ifnull(ApplyForPaymentsDetail.ApplyAmount,0)) as ApplyAmount From ApplyForPayments,ApplyForPaymentsDetail Where
    ApplyForPayments.rid=ApplyForPaymentsDetail.pid and ApplyForPaymentsDetail.KeyModaul='出运明细' and ApplyForPaymentsDetail.KeyNo=sKeyNo and 
    ApplyForPayments.PaymentType='国内费用');

    Update Shipments set AppliedForDomestic=ifnull(fApplyAmount,0),UnAppliedForDomestic=(ifnull(Miscellaneous,0)-ifnull(fApplyAmount,0))  Where 
    InvoiceNO=sKeyNo;
end $ 
delimiter ;