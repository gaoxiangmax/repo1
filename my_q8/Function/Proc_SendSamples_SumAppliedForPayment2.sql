/*
寄样管理-已申请付款
*/
delimiter $ 
drop procedure if exists Proc_SendSamples_SumAppliedForPayment2 $
create procedure Proc_SendSamples_SumAppliedForPayment2(sKeyNo varchar(255)) 
begin
    declare fAppliedForPayment decimal(18,2);
    set fAppliedForPayment=(Select Sum(ifnull(ApplyForPaymentsDetail.ApplyAmount,0)) as ApplyAmount From ApplyForPayments,ApplyForPaymentsDetail Where
        ApplyForPayments.rid=ApplyForPaymentsDetail.pid and ApplyForPaymentsDetail.KeyModaul='寄样管理' and ApplyForPaymentsDetail.KeyNo=sKeyNo and
        ApplyForPayments.CostName='快件费');
    Update SendSamples set AppliedForPayment = ifnull(fAppliedForPayment,0),UnAppliedForPayment=(ifnull(ExpressFees,0)-ifnull(fAppliedForPayment,0)) Where SendSamples.TNTNo=sKeyNo;
end $ 
delimiter ;