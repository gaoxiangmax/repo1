/*
退税管理
*/
delimiter $
drop trigger if exists Tgr_ExportRebatesDetail_AftereDelete $
create trigger Tgr_ExportRebatesDetail_AftereDelete after delete
on ExportRebatesDetail 
for each row
begin
    /*定义变量*/
    declare srid varchar(255);
    declare sInvoiceNO varchar(255); 
    set sInvoiceNO=old.InvoiceNO;
    set srid=(Select rid From Settlements Where InvoiceNO=sInvoiceNO Limit 0,1);
    call Proc_Settlements_SumTaxReceived(sInvoiceNO);-- 结算中心-已退税
    call Proc_Settlements_MathGrossProfit(srid);-- 结算中心-实际业务毛利
    call Proc_Settlements_LastRetired(sInvoiceNO);-- 结算中心-是否已退税
end$
delimiter ;