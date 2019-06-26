/*
开票通知-已申请货款-未申请货款
*/
delimiter $ 
drop procedure if exists Proc_BillNotifies_AppliedForPayment $
create procedure Proc_BillNotifies_AppliedForPayment(sKeyNo varchar(255)) 
begin
    declare fAppliedForPayment decimal(18,2);
    set fAppliedForPayment=(Select Sum(ifnull(ApplyForPaymentsDetail.ApplyAmount,0)) as ApplyAmount From ApplyForPayments,ApplyForPaymentsDetail Where
        ApplyForPayments.rid=ApplyForPaymentsDetail.pid and ApplyForPaymentsDetail.KeyModaul='开票通知' and ApplyForPaymentsDetail.KeyNo=sKeyNo and
        ApplyForPayments.CostName='货款');

    Update BillNotifies set AppliedForPayment = fAppliedForPayment,UnAppliedForPayment=ifnull(TotalBillAmount,0)-ifnull(fAppliedForPayment,0) Where BillNotifies.BillNotifyNo=sKeyNo;
end $ 
delimiter ;