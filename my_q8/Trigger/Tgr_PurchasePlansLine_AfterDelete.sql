/*
采购计划-产品资料
*/
delimiter $
drop trigger if exists Tgr_PurchasePlansLine_AftereDelete $
create trigger Tgr_PurchasePlansLine_AftereDelete after delete
on PurchasePlansLine 
for each row
begin
    call Proc_SalesOrders_SumPlaceQty(old.SOL_RecordID);-- 销售合同-下单数量
end$
delimiter ;