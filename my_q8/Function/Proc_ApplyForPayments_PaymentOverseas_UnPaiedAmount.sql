/*
付款申请-国外费用、已付金额、未付金额
*/
delimiter $ 
drop procedure if exists Proc_ApplyForPayments_PaymentOverseas_UnPaiedAmount $
create procedure Proc_ApplyForPayments_PaymentOverseas_UnPaiedAmount(sKeyNo varchar(255)) 
begin
    declare fAmountPaid decimal(18,2);
    set fAmountPaid=(Select Sum(ifnull(PayAmount,0)) as PayAmount From PaymentOverseas Where ID=sKeyNo);
    Update ApplyForPayments set PaymentOverseas = ifnull(fAmountPaid,0),PaiedAmount=(ifnull(fAmountPaid,0)+ifNull(Payment,0)+ifNULL(PaymentDomestic,0)),UnPaiedAmount=(ifNull(TotalApplyAmount,0)-(ifnull(fAmountPaid,0)+ifNull(Payment,0)+ifNULL(PaymentDomestic,0))) Where ApplyNo=sKeyNo;
end $ 
delimiter ;