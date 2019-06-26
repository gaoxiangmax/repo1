/*
收样管理-已申请快件费,未申请快件费
*/
delimiter $ 
drop procedure if exists Proc_ReceiveSamples_SumAppliedChargeed2 $
create procedure Proc_ReceiveSamples_SumAppliedChargeed2(sKeyNo varchar(255)) 
begin
    declare fAppliedChargeed decimal(18,2);
    set fAppliedChargeed=(Select Sum(ifnull(ApplyForPaymentsDetail.ApplyAmount,0)) as ApplyAmount From ApplyForPayments,ApplyForPaymentsDetail Where
    ApplyForPayments.rid=ApplyForPaymentsDetail.pid and ApplyForPaymentsDetail.KeyModaul='收样管理' and ApplyForPaymentsDetail.KeyNo=sKeyNo and
        ApplyForPayments.CostName='快件费');

    Update ReceiveSamples set AppliedChargeed =ifnull(fAppliedChargeed,0),UnAppliedAppliedChargeed=(ifnull(ReceiveCharge,0)-ifnull(fAppliedChargeed,0)) Where ReceiveSamples.TNTNo=sKeyNo;
end $ 
delimiter ;