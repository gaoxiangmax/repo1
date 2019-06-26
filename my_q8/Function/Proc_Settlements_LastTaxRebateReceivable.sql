/*
结算中心-应退税，未退税
*/
delimiter $ 
drop procedure if exists Proc_Settlements_LastTaxRebateReceivable $
create procedure Proc_Settlements_LastTaxRebateReceivable(sInvoiceNO varchar(255)) 
begin
    declare fTaxRebateReceivable decimal(18,2);
    set fTaxRebateReceivable=(Select ifnull(TotalExportRebates,0) From Shipments Where InvoiceNo=sInvoiceNO Limit 0,1);
    Update Settlements set TaxRebateReceivable=fTaxRebateReceivable,TaxRemain=(fTaxRebateReceivable-ifnull(TaxReceived,0))
        Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;