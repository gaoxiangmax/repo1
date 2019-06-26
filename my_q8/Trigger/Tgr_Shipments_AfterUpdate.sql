/*
出运明细
*/
delimiter $
drop trigger if exists Tgr_Shipments_AftereUpdate $
create trigger Tgr_Shipments_AftereUpdate after update
on Shipments 
for each row
begin
    /*定义变量*/
    declare sInvoiceNO varchar(255); 
    declare sNewCustomerNo varchar(255); 
    declare sOldCustomerNo varchar(255); 
    set sInvoiceNO=new.InvoiceNO;
    set sNewCustomerNo=new.CustomerNo;
    set sOldCustomerNo=old.CustomerNo;
    call Proc_Settlements_LastShipmentStatus(sInvoiceNO);-- 结算中心-出运状态
    call Proc_Settlements_LastPreCarriageBy(sInvoiceNO);-- 结算中心-前程运输
    call Proc_Settlements_LastForwarder(sInvoiceNO);-- 结算中心-船代公司
    call Proc_Settlements_LastTotalSalesAmount(sInvoiceNO);-- 结算中心-货值合计
    call Proc_Settlements_LastTotalCosts(sInvoiceNO);-- 结算中心-费用合计
    call Proc_Settlements_LastTaxRebateReceivable(sInvoiceNO);-- 结算中心-应退税
    call Proc_Settlements_LastMiscellaneousPayable(sInvoiceNO);-- 结算中心-应付运杂费
    call Proc_Settlements_LastCommissionPayable(sInvoiceNO);-- 结算中心-应付佣金
    call Proc_Settlements_LastSeaFreightPayable(sInvoiceNO);-- 结算中心-应付海运
    call Proc_Settlements_LastInsurancePayable(sInvoiceNO);-- 结算中心-应付保险
    call Proc_Shipments_TotalShipments(sNewCustomerNo);-- 结算中心-出货总额
    call Proc_Shipments_TotalShipments(sOldCustomerNo);-- 结算中心-出货总额
end$
delimiter ;