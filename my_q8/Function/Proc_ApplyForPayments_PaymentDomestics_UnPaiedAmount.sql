/*
付款申请-国内费用、已付金额、未付金额
*/
delimiter $ 
drop procedure if exists Proc_ApplyForPayments_PaymentDomestics_UnPaiedAmount $
create procedure Proc_ApplyForPayments_PaymentDomestics_UnPaiedAmount(sKeyNo varchar(255)) 
begin
    declare fAmountPaid decimal(18,2);
    set fAmountPaid=(Select Sum(ifnull(PayAmount,0)) as PayAmount From PaymentDomestics Where ID=sKeyNo);
    Update ApplyForPayments set PaymentDomestic = ifnull(fAmountPaid,0),PaiedAmount=(ifnull(fAmountPaid,0)+ifNull(Payment,0)+ifNULL(PaymentOverseas,0)),UnPaiedAmount=(ifNull(TotalApplyAmount,0)-(ifnull(fAmountPaid,0)+ifNull(Payment,0)+ifNULL(PaymentOverseas,0))) Where ApplyNo=sKeyNo;
end $ 
delimiter ;