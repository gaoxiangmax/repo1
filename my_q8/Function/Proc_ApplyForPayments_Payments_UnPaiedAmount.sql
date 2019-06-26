/*
付款申请-工厂付款、已付金额、未付金额
*/
delimiter $ 
drop procedure if exists Proc_ApplyForPayments_Payments_UnPaiedAmount $
create procedure Proc_ApplyForPayments_Payments_UnPaiedAmount(sKeyNo varchar(255)) 
begin
    declare fAmountPaid decimal(18,2);
    set fAmountPaid=(Select ifNull(Sum(Amount),0) as Amount From Payments Where ID=sKeyNo);
    Update ApplyForPayments set Payment = ifNull(fAmountPaid,0),PaiedAmount=(ifNull(fAmountPaid,0)+ifNull(PaymentOverseas,0)+ifNULL(PaymentDomestic,0)),UnPaiedAmount=(ifNull(TotalApplyAmount,0)-(ifNull(fAmountPaid,0)+ifNull(PaymentOverseas,0)+ifNULL(PaymentDomestic,0))) Where ApplyNo=sKeyNo;
end $ 
delimiter ;