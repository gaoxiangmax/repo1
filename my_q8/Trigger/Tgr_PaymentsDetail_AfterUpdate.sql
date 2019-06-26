/*
工厂付款-详细用途
*/
delimiter $
drop trigger if exists Tgr_PaymentsDetail_AftereUpdate $
create trigger Tgr_PaymentsDetail_AftereUpdate after update
on PaymentsDetail 
for each row
begin
    /*定义变量*/
    declare sNewKeyNo varchar(255); 
    declare sOldKeyNo varchar(255); 
    declare sNewInvoiceNO varchar(255); 
    declare sOldInvoiceNO varchar(255); 
    declare fNewUsedAmount decimal(18,2);
    declare fOldUsedAmount decimal(18,2);
    declare srid varchar(255); 
    set sNewKeyNo=new.KeyNo;
    set sOldKeyNo=old.KeyNo;
    set sNewInvoiceNO=new.InvoiceNO;
    set sOldInvoiceNO=old.InvoiceNO;
    set fNewUsedAmount=new.UsedAmount;
    set fOldUsedAmount=old.UsedAmount;
    if ifNull(sNewKeyNo,'')<>ifNull(sOldKeyNo,'') or fNewUsedAmount<>fOldUsedAmount then
        call Proc_PurchaseOrders_SumDownPayment(sNewKeyNo);-- 采购合同-已付定金、定金日期
        call Proc_PurchaseOrders_AmountPaid(sNewKeyNo);-- 采购合同-已付货款 
        call Proc_ReceiveSamples_SumPaySampleFees(sNewKeyNo);-- 收样管理-已付样品费

        call Proc_PurchaseOrders_SumDownPayment(sOldKeyNo);-- 采购合同-已付定金、定金日期
        call Proc_PurchaseOrders_AmountPaid(sOldKeyNo);-- 采购合同-已付货款 
        call Proc_ReceiveSamples_SumPaySampleFees(sOldKeyNo);-- 收样管理-已付样品费
    end if;

    if ifNull(sNewKeyNo,'')<>ifNull(sOldKeyNo,'') or ifNull(sNewInvoiceNO,'')<>ifNull(sOldInvoiceNO,'') or fNewUsedAmount<>fOldUsedAmount then
        set srid=(Select rid From Settlements Where InvoiceNO=sNewInvoiceNO Limit 0,1);
        call Proc_Settlements_SumDownPaymentPaidUp(sNewInvoiceNO,sNewKeyNo);-- 结算中心-工厂付款-已付定金
        call Proc_Settlements_SumAmountPaid(sNewInvoiceNO,sNewKeyNo);-- 结算中心-工厂付款-已付货款 
        call Proc_SettlementsDetail_MathGrossProfit(srid);-- 结算中心-实际业务毛利

        set srid=(Select rid From Settlements Where InvoiceNO=sOldInvoiceNO Limit 0,1);
        call Proc_Settlements_SumDownPaymentPaidUp(sOldInvoiceNO,sOldKeyNo);-- 结算中心-工厂付款-已付定金
        call Proc_Settlements_SumAmountPaid(sOldInvoiceNO,sOldKeyNo);-- 结算中心-工厂付款-已付货款 
        call Proc_SettlementsDetail_MathGrossProfit(srid);-- 结算中心-实际业务毛利
    end if;

    if ifNull(sNewInvoiceNO,'')<>ifNull(sOldInvoiceNO,'') or fNewUsedAmount<>fOldUsedAmount then
        set srid=(Select rid From Settlements Where InvoiceNO=sNewInvoiceNO Limit 0,1);
        call Proc_Settlements_SumSampleFeesPaidUp(sNewInvoiceNO);-- 结算中心-已付样品费  
        call Proc_Settlements_SumSuppliersOthersPaidUp(sNewInvoiceNO);-- 结算中心-已付其他费用
        call Proc_Settlements_MathGrossProfit(srid);-- 结算中心-实际业务毛利

        set srid=(Select rid From Settlements Where InvoiceNO=sOldInvoiceNO Limit 0,1);
        call Proc_Settlements_SumSampleFeesPaidUp(sOldInvoiceNO);-- 结算中心-已付样品费  
        call Proc_Settlements_SumSuppliersOthersPaidUp(sOldInvoiceNO);-- 结算中心-已付其他费用
        call Proc_Settlements_MathGrossProfit(srid);-- 结算中心-实际业务毛利
    end if;
end$
delimiter ;