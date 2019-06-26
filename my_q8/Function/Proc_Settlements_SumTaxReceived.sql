/*
结算中心-已退税,未退税
*/
delimiter $ 
drop procedure if exists Proc_Settlements_SumTaxReceived $
create procedure Proc_Settlements_SumTaxReceived(sInvoiceNO varchar(255)) 
begin
    declare fTaxReceived decimal(18,2);
    set fTaxReceived=(Select Sum(ifnull(ExportRebatesValue,0)) as ExportRebatesValue From ExportRebatesDetail
        Where InvoiceNO=sInvoiceNO);
    Update Settlements set TaxReceived=ifnull(fTaxReceived,0),TaxRemain=(ifnull(TaxRebateReceivable,0)-ifnull(fTaxReceived,0)) Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;