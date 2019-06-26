/*
采购合同-已付定金、定金日期
*/
delimiter $ 
drop procedure if exists Proc_PurchaseOrders_SumDownPayment $
create procedure Proc_PurchaseOrders_SumDownPayment(sKeyNo varchar(255)) 
begin
    Update PurchaseOrders set DownPayment = (Select Sum(ifnull(PaymentsDetail.UsedAmount,0)) as UsedAmount From Payments,PaymentsDetail Where
        Payments.rid=PaymentsDetail.pid and Payments.CostName='定金' and PaymentsDetail.KeyNo=sKeyNo),DownPaymentDate=(Select Max(PaymentsDetail.KeyDate) as KeyDate From Payments,PaymentsDetail Where
        Payments.rid=PaymentsDetail.pid and Payments.CostName='定金' and PaymentsDetail.KeyNo=sKeyNo) Where 
        PurchaseOrderNo=sKeyNo;
end $ 
delimiter ;