/*
收样管理-已付快件费,未付快件费
*/
delimiter $ 
drop procedure if exists Proc_ReceiveSamples_SumReceiveChargeed2 $
create procedure Proc_ReceiveSamples_SumReceiveChargeed2(srid varchar(255),sKeyNo varchar(255)) 
begin
    declare sReceiver1 varchar(255);
    declare fReceiveChargeed decimal(18,2);
    set sReceiver1=(Select Receiver1 From PaymentDomestics Where rid=srid Limit 0,1);
    set fReceiveChargeed=(Select Sum(ifnull(PaymentDomesticsDetail.UsedAmount,0)) as UsedAmount From PaymentDomestics,PaymentDomesticsDetail Where
        PaymentDomestics.rid=PaymentDomesticsDetail.pid and PaymentDomestics.Receiver1=sReceiver1 and PaymentDomestics.CostName='快件费' and 
        PaymentDomesticsDetail.KeyNo=sKeyNo);
        
    Update ReceiveSamples set ReceiveChargeed =ifnull(fReceiveChargeed,0),UnReceiveCharge=(ifnull(ReceiveCharge,0)-ifnull(fReceiveChargeed,0))  Where ReceiveSamples.ExpressCorp =sReceiver1 and ReceiveSamples.TNTNo=sKeyNo;
end $ 
delimiter ;