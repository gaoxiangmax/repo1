/*
国内费用-详细用途
*/
delimiter $
drop trigger if exists Tgr_PaymentDomesticsDetail_AftereDelete $
create trigger Tgr_PaymentDomesticsDetail_AftereDelete after delete
on PaymentDomesticsDetail 
for each row
begin
    /*定义变量*/
    declare srid varchar(255); 
    declare sKeyNo varchar(255); 
    declare sInvoiceNO varchar(255); 
    declare SettlementsRid varchar(255); 
    set srid=old.pid;
    set sKeyNo=old.KeyNo;
    set sInvoiceNO=old.InvoiceNO;
    call Proc_ReceiveSamples_SumReceiveChargeed(srid,sKeyNo);-- 收样管理-已付快件费
    call Proc_SendSamples_SumExpressFeesed(srid,sKeyNo);-- 寄样管理-已付快件费
    set SettlementsRid=(Select rid From Settlements Where InvoiceNO=sInvoiceNO Limit 0,1);
    call Proc_Settlements_SumMiscellaneousPaidUp(sInvoiceNO);-- 结算费用-已付运杂费
    call Proc_Settlements_SumExpressFees(sInvoiceNO);-- 结算费用-已付快件费
    call Proc_Settlements_SumOtherDomesticsPaidUp(sInvoiceNO);-- 结算中心-国内其他费用
    call Proc_Settlements_MathGrossProfit(SettlementsRid);-- 结算中心-实际业务毛利
end$
delimiter ;