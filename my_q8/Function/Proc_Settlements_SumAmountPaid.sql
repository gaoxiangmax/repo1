/*
结算中心-工厂付款-已付货款，工厂付款-已付货款￥,已付合计，已付合计￥，未付货款，未付货款￥
*/
delimiter $ 
drop procedure if exists Proc_Settlements_SumAmountPaid $
create procedure Proc_Settlements_SumAmountPaid(sInvoiceNO varchar(255),sKeyNo varchar(255)) 
begin
    declare fAmountPaid decimal(18,2);
    set fAmountPaid=(Select Sum(ifnull(PaymentsDetail.UsedAmount,0)) as UsedAmount From PaymentsDetail,Payments
        Where PaymentsDetail.pid=Payments.rid and PaymentsDetail.InvoiceNO=sInvoiceNO and PaymentsDetail.KeyNo=sKeyNo and Payments.CostName='货款');
        
    Update Settlements,SettlementsDetail set SettlementsDetail.AmountPaid=ifnull(fAmountPaid,0),
    SettlementsDetail.CNYAmountPaid=(ifnull(fAmountPaid,0)*ifnull(SettlementsDetail.ExchangeRate,0)),
    SettlementsDetail.TotalPaidUp=(ifnull(SettlementsDetail.DownPaymentPaidUp,0)+ifnull(fAmountPaid,0)),
    SettlementsDetail.CNYTotalPaidUp=((ifnull(SettlementsDetail.DownPaymentPaidUp,0)+ifnull(fAmountPaid,0))*ifnull(SettlementsDetail.ExchangeRate,0)),
    SettlementsDetail.SuppliersRemain=(ifnull(SettlementsDetail.SuppliersPayable,0)-ifnull(SettlementsDetail.DownPaymentPaidUp,0)-fAmountPaid-ifnull(SettlementsDetail.ClaimAmount,0)),
    SettlementsDetail.CNYSuppliersRemain=(((ifnull(SettlementsDetail.SuppliersPayable,0)-ifnull(SettlementsDetail.DownPaymentPaidUp,0)-ifnull(fAmountPaid,0)-ifnull(SettlementsDetail.ClaimAmount,0))*ifnull(SettlementsDetail.ExchangeRate,0)))
        Where Settlements.rid=SettlementsDetail.pid and Settlements.InvoiceNO=sInvoiceNO and SettlementsDetail.PurchaseOrderNo=sKeyNo;
end $ 
delimiter ;