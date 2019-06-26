/*
采购合同-已付货款
*/
delimiter $ 
drop procedure if exists Proc_PurchaseOrders_AmountPaid2 $
create procedure Proc_PurchaseOrders_AmountPaid2(sKeyNo varchar(255)) 
begin
    declare fAmountPaid decimal(18,2);
    set fAmountPaid=(Select Sum(ifnull(PaymentsDetail.UsedAmount,0)) as UsedAmount From Payments,PaymentsDetail Where
        Payments.rid=PaymentsDetail.pid and PaymentsDetail.KeyNo=sKeyNo);
    Update PurchaseOrders set AmountPaid = ifnull(fAmountPaid,0),CNYSuppliersRemain=(ifNull(TotalOrderAmount,0)-ifnull(fAmountPaid,0)),AppliedForPayment=ifNull(TotalOrderAmount,0),CanPayment=0 Where 
        PurchaseOrderNo=sKeyNo;
end $ 
delimiter ;