/*
结算中心-工厂付款-索赔金额，未付货款，未付货款￥
*/
delimiter $ 
drop procedure if exists Proc_Settlements_SumSupplierClaimAmount $
create procedure Proc_Settlements_SumSupplierClaimAmount(sInvoiceNO varchar(255),sKeyNo varchar(255)) 
begin
    declare fClaimAmount decimal(18,2);
    declare fSuppliersRemain decimal(18,2);
    declare fCNYSuppliersRemain decimal(18,2);
    declare srid varchar(36);
    set fClaimAmount=(Select Sum(ifnull(ComplaintsBlames.PayedAmount,0)) as PayedAmount From ComplaintsBlames,Complaints
        Where ComplaintsBlames.pid=Complaints.rid and Complaints.InvoiceNO=sInvoiceNO and ComplaintsBlames.PurchaseOrderNo=sKeyNo);
    set fSuppliersRemain=(Select (ifnull(SettlementsDetail.SuppliersPayable,0)-ifnull(SettlementsDetail.DownPaymentPaidUp,0)-ifnull(SettlementsDetail.AmountPaid,0)-ifnull(fClaimAmount,0)) as SuppliersRemain From Settlements,SettlementsDetail 
        Where Settlements.rid=SettlementsDetail.pid and Settlements.InvoiceNO=sInvoiceNO and SettlementsDetail.PurchaseOrderNo=sKeyNo);
        set fCNYSuppliersRemain=(Select (ifnull(fSuppliersRemain,0)*ifnull(SettlementsDetail.ExchangeRate,0)) as CNYSuppliersRemain From Settlements,SettlementsDetail 
        Where Settlements.rid=SettlementsDetail.pid and Settlements.InvoiceNO=sInvoiceNO and SettlementsDetail.PurchaseOrderNo=sKeyNo);
        set srid=(Select rid From Settlements Where InvoiceNO=sInvoiceNO Limit 0,1);
    Update Settlements,SettlementsDetail set SettlementsDetail.ClaimAmount=ifnull(fClaimAmount,0),SettlementsDetail.SuppliersRemain=ifnull(fSuppliersRemain,0),SettlementsDetail.CNYSuppliersRemain=ifnull(fCNYSuppliersRemain,0)
        Where Settlements.rid=SettlementsDetail.pid and Settlements.InvoiceNO=sInvoiceNO and SettlementsDetail.PurchaseOrderNo=sKeyNo;
end $ 
delimiter ;