/*
收样管理-已付样品费，未付样品费
*/
delimiter $ 
drop procedure if exists Proc_ReceiveSamples_SumPaySampleFees2 $
create procedure Proc_ReceiveSamples_SumPaySampleFees2(sKeyNo varchar(255)) 
begin
    declare fPaySampleFees decimal(18,2);
    set fPaySampleFees=(Select Sum(ifnull(PaymentsDetail.UsedAmount,0)) as UsedAmount From Payments,PaymentsDetail Where
        Payments.rid=PaymentsDetail.pid and PaymentsDetail.KeyModaul='收样管理' and Payments.CostName='样品费' and PaymentsDetail.KeyNo=sKeyNo);

    Update ReceiveSamples set PaySampleFees = ifnull(fPaySampleFees,0),UnPaySampleFees=(ifnull(SampleFees,0)-ifnull(fPaySampleFees,0)) Where 
        ReceiveSamples.TNTNo=sKeyNo;
end $ 
delimiter ;