/*
出运明细-采购明细
*/
delimiter $
drop trigger if exists Tgr_ShipmentsDelivery_AftereDelete $
create trigger Tgr_ShipmentsDelivery_AftereDelete after delete
on ShipmentsDelivery 
for each row
begin
    call Proc_PurchaseOrders_SumShippingQty(old.SOL_RecordID,old.PurchaseOrderNo,old.ItemNo);-- 采购合同-出货数量
end$
delimiter ;