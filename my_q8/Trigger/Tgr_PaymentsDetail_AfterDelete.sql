/*
工厂付款-详细用途
*/
delimiter $
drop trigger if exists Tgr_PaymentsDetail_AftereDelete $
create trigger Tgr_PaymentsDetail_AftereDelete after delete
on PaymentsDetail 
for each row
begin
    /*定义变量*/
    declare sKeyNo varchar(255); 
    declare sInvoiceNO varchar(255); 
    declare srid varchar(255); 
    set sKeyNo=old.KeyNo;
    set sInvoiceNO=old.InvoiceNO;
    call Proc_PurchaseOrders_SumDownPayment(sKeyNo);-- 采购合同-已付定金、定金日期
    call Proc_PurchaseOrders_AmountPaid(sKeyNo);-- 采购合同-已付货款
    call Proc_ReceiveSamples_SumPaySampleFees(sKeyNo);-- 收样管理-已付样品费
    set srid=(Select rid From Settlements Where InvoiceNO=sInvoiceNO Limit 0,1);
    call Proc_Settlements_SumDownPaymentPaidUp(sInvoiceNO,sKeyNo);-- 结算中心-工厂付款-已付定金
    call Proc_Settlements_SumAmountPaid(sInvoiceNO,sKeyNo);-- 结算中心-工厂付款-已付货款 
    call Proc_Settlements_SumSampleFeesPaidUp(sInvoiceNO);-- 结算中心-已付样品费  
    call Proc_Settlements_SumSuppliersOthersPaidUp(sInvoiceNO);-- 结算中心-已付其他费用
    call Proc_SettlementsDetail_MathGrossProfit(srid);-- 结算中心-实际业务毛利
end$
delimiter ;