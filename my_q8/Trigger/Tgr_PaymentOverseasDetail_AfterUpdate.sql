/*
国外费用-详细用途
*/
delimiter $
drop trigger if exists Tgr_PaymentOverseasDetail_AftereUpdate $
create trigger Tgr_PaymentOverseasDetail_AftereUpdate after update
on PaymentOverseasDetail 
for each row
begin
    /*定义变量*/
    declare srid varchar(255); 
    declare sKeyNo varchar(255); 
    declare sOldKeyNo varchar(255); 
    declare fUsedAmount decimal(18,2);
    declare fOldUsedAmount decimal(18,2);
    set sKeyNo=new.InvoiceNO;
    set sOldKeyNo=old.InvoiceNO;
    set fUsedAmount=new.UsedAmount;
    set fOldUsedAmount=old.UsedAmount;
    if ifNull(sKeyNo,'')<>ifNull(sOldKeyNo,'') or fUsedAmount<>fOldUsedAmount then
        set srid=(Select rid From Settlements Where InvoiceNO=sKeyNo Limit 0,1);
        call Proc_Settlements_SumCommissionPaidUp(sKeyNo);-- 结算中心-已付佣金
        call Proc_Settlements_SumInsurancePaidUp(sKeyNo);-- 结算中心-已付保险
        call Proc_Settlements_SumSeaFreightPaidUp(sKeyNo);-- 结算中心-已付海运
        call Proc_Settlements_SumOtherOverseasPaidUp(sKeyNo);-- 结算中心-其它国外费用
        call Proc_Settlements_MathGrossProfit(srid);-- 结算中心-实际业务毛利

        set srid=(Select rid From Settlements Where InvoiceNO=sOldKeyNo Limit 0,1);
        call Proc_Settlements_SumCommissionPaidUp(sOldKeyNo);-- 结算中心-已付佣金
        call Proc_Settlements_SumInsurancePaidUp(sOldKeyNo);-- 结算中心-已付保险
        call Proc_Settlements_SumSeaFreightPaidUp(sOldKeyNo);-- 结算中心-已付海运
        call Proc_Settlements_SumOtherOverseasPaidUp(sOldKeyNo);-- 结算中心-其它国外费用
        call Proc_Settlements_MathGrossProfit(srid);-- 结算中心-实际业务毛利
    end if;
end$
delimiter ;