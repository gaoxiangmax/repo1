/*
出运明细-采购明细
*/
delimiter $
drop trigger if exists Tgr_ShipmentsDelivery_AftereInsert $
create trigger Tgr_ShipmentsDelivery_AftereInsert after insert
on ShipmentsDelivery 
for each row
begin
    call Proc_PurchaseOrders_SumShippingQty(new.SOL_RecordID,new.PurchaseOrderNo,new.ItemNo);-- 采购合同-出货数量
end$
delimiter ;