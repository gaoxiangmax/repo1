/*
客诉管理
*/
delimiter $
drop trigger if exists Tgr_ComplaintsBlames_AftereInsert $
create trigger Tgr_ComplaintsBlames_AftereInsert after insert
on ComplaintsBlames 
for each row
begin
    /*定义变量*/
    declare sInvoiceNO varchar(255);
    declare sSettlementsRid varchar(255); 
    declare sKeyNo varchar(255); 
    declare srid varchar(255); 
    set sKeyNo=new.PurchaseOrderNo;
    set srid=new.pid;
    set sInvoiceNO=(Select InvoiceNO From Complaints Where rid=srid limit 0,1);
    set sSettlementsRid=(Select rid From Settlements Where InvoiceNO=sInvoiceNO Limit 0,1);
    call Proc_Settlements_SumSupplierClaimAmount(sInvoiceNO,sKeyNo);-- 结算中心-工厂付款-索赔金额
    call Proc_SettlementsDetail_MathGrossProfit(sSettlementsRid);-- 结算中心-实际业务毛利
end$
delimiter ;