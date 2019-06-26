/*
寄样管理-已付快件费
*/
delimiter $ 
drop procedure if exists Proc_SendSamples_SumExpressFeesed $
create procedure Proc_SendSamples_SumExpressFeesed(srid varchar(255),sKeyNo varchar(255)) 
begin
    declare sReceiver1 varchar(255);
    declare fExpressFeesed decimal(18,2);
    set sReceiver1=(Select Receiver1 From PaymentDomestics Where rid=srid Limit 0,1);
    set fExpressFeesed=(Select Sum(ifnull(PaymentDomesticsDetail.UsedAmount,0)) as UsedAmount From PaymentDomestics,PaymentDomesticsDetail Where
        PaymentDomestics.rid=PaymentDomesticsDetail.pid and PaymentDomestics.Receiver1=sReceiver1 and PaymentDomesticsDetail.KeyNo=sKeyNo);
    Update SendSamples set ExpressFeesed = ifnull(fExpressFeesed,0),UnExpressFees=(ifnull(ExpressFees,0)-ifnull(fExpressFeesed,0)) Where 
        SendSamples.Exepressname =sReceiver1 and SendSamples.TNTNo=sKeyNo;
end $ 
delimiter ;