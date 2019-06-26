/*
结算中心-已付快件费
*/
delimiter $ 
drop procedure if exists Proc_Settlements_SumExpressFees2 $
create procedure Proc_Settlements_SumExpressFees2(sInvoiceNO varchar(255)) 
begin
    declare fExpressFees decimal(18,2);
    set fExpressFees=(Select Sum(ifnull(PaymentDomesticsDetail.UsedAmount,0)) as UsedAmount From PaymentDomestics,PaymentDomesticsDetail
        Where PaymentDomestics.rid=PaymentDomesticsDetail.pid and PaymentDomesticsDetail.KeyNo=sInvoiceNO and PaymentDomestics.CostName='快件费');
    Update Settlements set ExpressFees=ifnull(fExpressFees,0) Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;