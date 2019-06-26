/*
结算中心-已付其他费用 
*/
delimiter $ 
drop procedure if exists Proc_Settlements_SumSuppliersOthersPaidUp $
create procedure Proc_Settlements_SumSuppliersOthersPaidUp(sInvoiceNO varchar(255)) 
begin
    declare fSuppliersOthersPaidUp decimal(18,2);
    set fSuppliersOthersPaidUp=(Select Sum(ifnull(PaymentsDetail.UsedAmount,0)) as UsedAmount From PaymentsDetail,Payments
        Where PaymentsDetail.pid=Payments.rid and PaymentsDetail.InvoiceNO=sInvoiceNO and Payments.CostName='其它');
    Update Settlements set SuppliersOthersPaidUp=ifnull(fSuppliersOthersPaidUp,0) Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;