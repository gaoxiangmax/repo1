/*
采购计划-产品资料
*/
delimiter $
drop trigger if exists Tgr_PurchasePlansLine_AftereInsert $
create trigger Tgr_PurchasePlansLine_AftereInsert after insert
on PurchasePlansLine 
for each row
begin
    call Proc_SalesOrders_SumPlaceQty(new.SOL_RecordID);-- 销售合同-下单数量
end$
delimiter ;