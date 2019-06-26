/*
客户收汇-详细用途
*/
delimiter $
drop trigger if exists Tgr_IncomesDetail_AftereDelete $
create trigger Tgr_IncomesDetail_AftereDelete after delete
on IncomesDetail 
for each row
begin
    /*定义变量*/
    declare srid varchar(255);
    declare sKeyNo varchar(255); 
    declare sInvoiceNO varchar(255); 
    declare SettlementsRid varchar(255);
    set srid=old.pid;
    set sKeyNo=old.KeyID;
    set sInvoiceNO=old.InvoiceNO;
    call Proc_SalesOrders_SumDownPayment(sKeyNo);-- 销售合同-已收定金
    call Proc_SendSamples_SumInSampleFees(srid,sKeyNo);-- 寄样管理-已收样品费
    set SettlementsRid=(Select rid From Settlements Where InvoiceNO=sInvoiceNO Limit 0,1);
    call Proc_Settlements_SumReceivedAccount(sInvoiceNO);-- 结算中心-已收货款
    call Proc_Settlements_MathGrossProfit(SettlementsRid);-- 结算中心-实际业务毛利
end$
delimiter ;