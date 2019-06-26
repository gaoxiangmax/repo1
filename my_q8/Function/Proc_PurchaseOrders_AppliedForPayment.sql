/*
采购合同-可申请定金
*/
delimiter $ 
drop procedure if exists Proc_PurchaseOrders_AppliedForPayment $
create procedure Proc_PurchaseOrders_AppliedForPayment(sKeyNo varchar(255)) 
begin
    declare fAppliedForPayment decimal(18,2);
    set fAppliedForPayment=(Select Sum(ifnull(ApplyForPaymentsDetail.ApplyAmount,0)) as ApplyAmount From ApplyForPayments,ApplyForPaymentsDetail Where
        ApplyForPayments.rid=ApplyForPaymentsDetail.pid and ApplyForPayments.PaymentType='工厂付款' and ApplyForPayments.CostName='定金' and ApplyForPaymentsDetail.KeyModaul='采购合同' and ApplyForPaymentsDetail.KeyNo=sKeyNo);
    Update PurchaseOrders set AppliedForPayment = ifnull(fAppliedForPayment,0),CanPayment=(ifNull(TotalOrderAmount,0)-ifnull(fAppliedForPayment,0)) Where 
        PurchaseOrderNo=sKeyNo;
end $ 
delimiter ;