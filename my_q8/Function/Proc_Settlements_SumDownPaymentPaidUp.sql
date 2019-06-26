/*
结算中心-工厂付款-已付定金，工厂付款-已付定金￥，已付合计，已付合计￥，未付货款，未付货款￥
*/
delimiter $ 
drop procedure if exists Proc_Settlements_SumDownPaymentPaidUp $
create procedure Proc_Settlements_SumDownPaymentPaidUp(sInvoiceNO varchar(255),sKeyNo varchar(255)) 
begin
    declare fDownPaymentPaidUp decimal(18,2);
    set fDownPaymentPaidUp=(Select Sum(ifnull(PaymentsDetail.UsedAmount,0)) as UsedAmount From PaymentsDetail,Payments
        Where PaymentsDetail.pid=Payments.rid and PaymentsDetail.InvoiceNO=sInvoiceNO and PaymentsDetail.KeyNo=sKeyNo and Payments.CostName='定金');
        
    Update Settlements,SettlementsDetail set SettlementsDetail.DownPaymentPaidUp=ifnull(fDownPaymentPaidUp,0),
    SettlementsDetail.CNYDownPaymentPaidUp=(ifnull(fDownPaymentPaidUp,0)*ifnull(SettlementsDetail.ExchangeRate,0)),
    SettlementsDetail.TotalPaidUp=(ifnull(fDownPaymentPaidUp,0) + ifnull(SettlementsDetail.AmountPaid,0)),
    SettlementsDetail.CNYTotalPaidUp=((ifnull(fDownPaymentPaidUp,0)+ifnull(SettlementsDetail.AmountPaid,0))*ifnull(SettlementsDetail.ExchangeRate,0)),
    SettlementsDetail.SuppliersRemain=(ifnull(SettlementsDetail.SuppliersPayable,0)-ifnull(fDownPaymentPaidUp,0)-ifnull(SettlementsDetail.AmountPaid,0)-ifnull(SettlementsDetail.ClaimAmount,0)),
    SettlementsDetail.CNYSuppliersRemain=(((ifnull(SettlementsDetail.SuppliersPayable,0)-ifnull(fDownPaymentPaidUp,0)-ifnull(SettlementsDetail.AmountPaid,0)-ifnull(SettlementsDetail.ClaimAmount,0))*ifnull(SettlementsDetail.ExchangeRate,0)))
        Where Settlements.rid=SettlementsDetail.pid and Settlements.InvoiceNO=sInvoiceNO and SettlementsDetail.PurchaseOrderNo=sKeyNo;
end $ 
delimiter ;
