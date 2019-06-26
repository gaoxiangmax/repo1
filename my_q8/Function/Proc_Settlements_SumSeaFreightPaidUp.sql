/*
结算中心-已付海运，未付海运
*/
delimiter $
drop procedure if exists Proc_Settlements_SumSeaFreightPaidUp $ 
create procedure Proc_Settlements_SumSeaFreightPaidUp(sInvoiceNO varchar(255)) 
begin
    declare fSeaFreightPaidUp decimal(18,2);
    declare fCNYSeaFreightPaidUp decimal(18,2);
    set fSeaFreightPaidUp=(Select Sum(ifnull(PaymentOverseasDetail.UsedAmount,0)) as UsedAmount From PaymentOverseas,PaymentOverseasDetail
        Where PaymentOverseas.rid=PaymentOverseasDetail.pid and  KeyNo=sInvoiceNO and PaymentOverseas.CostName='海运费');

    set fCNYSeaFreightPaidUp=(Select Sum(ifnull(PaymentOverseasDetail.UsedAmountRMB,0)) as UsedAmount From PaymentOverseas,PaymentOverseasDetail
        Where PaymentOverseas.rid=PaymentOverseasDetail.pid and  KeyNo=sInvoiceNO and PaymentOverseas.CostName='海运费');

    Update Settlements set SeaFreightPaidUp=ifnull(fSeaFreightPaidUp,0),SeaFreightRemain=(ifnull(SeaFreightPayable,0)-ifnull(fSeaFreightPaidUp,0)),CNYSeaFreightPaidUp=ifnull(fCNYSeaFreightPaidUp,0) Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;