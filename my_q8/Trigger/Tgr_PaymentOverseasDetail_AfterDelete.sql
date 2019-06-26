/*
国外费用-详细用途
*/
delimiter $
drop trigger if exists Tgr_PaymentOverseasDetail_AftereDelete $
create trigger Tgr_PaymentOverseasDetail_AftereDelete after delete
on PaymentOverseasDetail 
for each row
begin
    /*定义变量*/
    declare srid varchar(255); 
    declare sInvoiceNO varchar(255); 
    set sInvoiceNO=old.InvoiceNO;
    set srid=(Select rid From Settlements Where InvoiceNO=sInvoiceNO Limit 0,1);
    call Proc_Settlements_SumCommissionPaidUp(sInvoiceNO);-- 结算中心-已付佣金
    call Proc_Settlements_SumInsurancePaidUp(sInvoiceNO);-- 结算中心-已付保险
    call Proc_Settlements_SumSeaFreightPaidUp(sInvoiceNO);-- 结算中心-已付海运
    call Proc_Settlements_SumOtherOverseasPaidUp(sInvoiceNO);-- 结算中心-其它国外费用
    call Proc_Settlements_MathGrossProfit(srid);-- 结算中心-实际业务毛利
end$
delimiter ;