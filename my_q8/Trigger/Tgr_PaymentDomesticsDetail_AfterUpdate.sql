/*
国内费用-详细用途
*/
delimiter $
drop trigger if exists Tgr_PaymentDomesticsDetail_AftereUpdate $
create trigger Tgr_PaymentDomesticsDetail_AftereUpdate after update
on PaymentDomesticsDetail 
for each row
begin
    /*定义变量*/
    declare srid varchar(255); 
    declare sNewKeyNo varchar(255);
    declare sOldKeyNo varchar(255); 
    declare sNewKeyModaul varchar(255);
    declare sOldKeyModaul varchar(255);
    declare fNewUsedAmount decimal(18,2);
    declare fOldUsedAmount decimal(18,2);
    declare sNewInvoiceNO varchar(255); 
    declare sOldInvoiceNO varchar(255); 
    declare SettlementsRid varchar(255); 
    set srid=new.pid;
    set sNewKeyNo=new.KeyNo;
    set sOldKeyNo=old.KeyNo;
    set sNewKeyModaul=new.KeyModaul;
    set sOldKeyModaul=old.KeyModaul;
    set fNewUsedAmount=new.UsedAmount;
    set fOldUsedAmount=old.UsedAmount;
    set sNewInvoiceNO=new.InvoiceNO;
    set sOldInvoiceNO=old.InvoiceNO;
    if ifNull(sNewKeyNo,'')<>ifNull(sOldKeyNo,'') or ifNull(sNewKeyModaul,'')<>ifNull(sOldKeyModaul,'') or fNewUsedAmount<>fOldUsedAmount or ifNull(sNewInvoiceNO,'')<>ifNull(sOldInvoiceNO,'') then
        call Proc_ReceiveSamples_SumReceiveChargeed(srid,sNewKeyNo);-- 收样管理-已付快件费
        call Proc_SendSamples_SumExpressFeesed(srid,sNewKeyNo);-- 寄样管理-已付快件费
        set SettlementsRid=(Select rid From Settlements Where InvoiceNO=sNewInvoiceNO Limit 0,1);
        call Proc_Settlements_SumMiscellaneousPaidUp(sNewInvoiceNO);-- 结算费用-已付运杂费
        call Proc_Settlements_SumExpressFees(sNewInvoiceNO);-- 结算费用-已付快件费
        call Proc_Settlements_SumOtherDomesticsPaidUp(sNewInvoiceNO);-- 结算中心-国内其他费用
        call Proc_Settlements_MathGrossProfit(SettlementsRid);-- 结算中心-实际业务毛利

        call Proc_ReceiveSamples_SumReceiveChargeed(srid,sOldKeyNo);-- 收样管理-已付快件费
        call Proc_SendSamples_SumExpressFeesed(srid,sOldKeyNo);-- 寄样管理-已付快件费
        set SettlementsRid=(Select rid From Settlements Where InvoiceNO=sOldInvoiceNO Limit 0,1);
        call Proc_Settlements_SumMiscellaneousPaidUp(sOldInvoiceNO);-- 结算费用-已付运杂费
        call Proc_Settlements_SumExpressFees(sOldInvoiceNO);-- 结算费用-已付快件费
        call Proc_Settlements_SumOtherDomesticsPaidUp(sOldInvoiceNO);-- 结算中心-国内其他费用
        call Proc_Settlements_MathGrossProfit(SettlementsRid);-- 结算中心-实际业务毛利
    end if;
end$
delimiter ;