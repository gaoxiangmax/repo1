/*
收样管理-已申请样品费，未申请样品费
*/
delimiter $ 
drop procedure if exists Proc_ReceiveSamples_SumAppliedForPayment2 $
create procedure Proc_ReceiveSamples_SumAppliedForPayment2(sKeyNo varchar(255)) 
begin
    declare fAppliedForPayment decimal(18,2);
    set fAppliedForPayment=(Select Sum(ifnull(ApplyForPaymentsDetail.ApplyAmount,0)) as ApplyAmount From ApplyForPayments,ApplyForPaymentsDetail Where
        ApplyForPayments.rid=ApplyForPaymentsDetail.pid and ApplyForPaymentsDetail.KeyModaul='收样管理' and ApplyForPaymentsDetail.KeyNo=sKeyNo and
        ApplyForPayments.CostName='样品费');

    Update ReceiveSamples set AppliedForPayment = ifnull(fAppliedForPayment,0),UnAppliedForPayment=(ifnull(SampleFees,0)-ifnull(fAppliedForPayment,0)) Where ReceiveSamples.TNTNo=sKeyNo;
end $ 
delimiter ;