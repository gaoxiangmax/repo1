/*
退税管理
*/
delimiter $
drop trigger if exists Tgr_ExportRebatesDetail_AftereUpdate $
create trigger Tgr_ExportRebatesDetail_AftereUpdate after update
on ExportRebatesDetail 
for each row
begin
    /*定义变量*/
    declare sInvoiceNO varchar(255); 
    declare sOldInvoiceNO varchar(255);
    declare srid varchar(255);
    set sInvoiceNO=new.InvoiceNO;
    set sOldInvoiceNO=old.InvoiceNO;
    set srid=(Select rid From Settlements Where InvoiceNO=sInvoiceNO Limit 0,1);
    call Proc_Settlements_SumTaxReceived(sInvoiceNO);-- 结算中心-已退税
    call Proc_Settlements_MathGrossProfit(srid);-- 结算中心-实际业务毛利
    call Proc_Settlements_LastRetired(sInvoiceNO);-- 结算中心-是否已退税

    set srid=(Select rid From Settlements Where InvoiceNO=sOldInvoiceNO Limit 0,1);
    call Proc_Settlements_SumTaxReceived(sOldInvoiceNO);-- 结算中心-已退税
    call Proc_Settlements_MathGrossProfit(srid);-- 结算中心-实际业务毛利
    call Proc_Settlements_LastRetired(sOldInvoiceNO);-- 结算中心-是否已退税
end$
delimiter ;