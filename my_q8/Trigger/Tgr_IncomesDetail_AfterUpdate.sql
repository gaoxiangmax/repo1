/*
客户收汇-详细用途
*/
delimiter $
drop trigger if exists Tgr_IncomesDetail_AftereUpdate $
create trigger Tgr_IncomesDetail_AftereUpdate after update
on IncomesDetail 
for each row
begin
    /*定义变量*/
    declare srid varchar(255);
    declare sNewKeyNo varchar(255); 
    declare sOldKeyNo varchar(255); 
    declare sNewCostName varchar(255); 
    declare sOldCostName varchar(255); 
    declare fNewUsedAmount decimal(18,2);
    declare fOldUsedAmount decimal(18,2);
    declare sNewInvoiceNO varchar(255); 
    declare sOldInvoiceNO varchar(255); 
    declare SettlementsRid varchar(255);
    set srid=new.pid;
    set sNewKeyNo=new.KeyID;
    set sOldKeyNo=old.KeyID;
    set sNewCostName=new.CostName;
    set sOldCostName=old.CostName;
    set fNewUsedAmount=new.UsedAmount;
    set fOldUsedAmount=old.UsedAmount;
    set sNewInvoiceNO=new.InvoiceNO;
    set sOldInvoiceNO=old.InvoiceNO;
    if ifNull(sNewKeyNo,'')<>ifNull(sOldKeyNo,'') or ifNull(sNewCostName,'')<>ifNull(sOldCostName,'') or fNewUsedAmount<>fOldUsedAmount or ifNull(sNewInvoiceNO,'')<>ifNull(sOldInvoiceNO,'') then
        call Proc_SalesOrders_SumDownPayment(sNewKeyNo);-- 销售合同-已收定金
        call Proc_SendSamples_SumInSampleFees(srid,sNewKeyNo);-- 寄样管理-已收样品费
        set SettlementsRid=(Select rid From Settlements Where InvoiceNO=sNewInvoiceNO Limit 0,1);
        call Proc_Settlements_SumReceivedAccount(sNewInvoiceNO);-- 结算中心-已收货款
        call Proc_Settlements_MathGrossProfit(SettlementsRid);-- 结算中心-实际业务毛利

        call Proc_SalesOrders_SumDownPayment(sOldKeyNo);-- 销售合同-已收定金
        call Proc_SendSamples_SumInSampleFees(srid,sOldKeyNo);-- 寄样管理-已收样品费
        set SettlementsRid=(Select rid From Settlements Where InvoiceNO=sOldKeyNo Limit 0,1);
        call Proc_Settlements_SumReceivedAccount(sOldKeyNo);-- 结算中心-已收货款
        call Proc_Settlements_MathGrossProfit(SettlementsRid);-- 结算中心-实际业务毛利
    end if;
end$
delimiter ;