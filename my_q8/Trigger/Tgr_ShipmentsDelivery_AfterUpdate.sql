/*
出运明细-采购明细
*/
delimiter $
drop trigger if exists Tgr_ShipmentsDelivery_AftereUpdate $
create trigger Tgr_ShipmentsDelivery_AftereUpdate after update
on ShipmentsDelivery 
for each row
begin
    /*定义变量*/
    declare sSOL_RecordID varchar(255); 
    declare sPurchaseOrderNo varchar(255);
    declare sItemNo varchar(255);
    declare fShippingQty decimal(18,2);
    declare sOldSOL_RecordID varchar(255); 
    declare sOldPurchaseOrderNo varchar(255);
    declare sOldItemNo varchar(255);
    declare fOldShippingQty decimal(18,2);
    set sSOL_RecordID=new.SOL_RecordID;
    set sPurchaseOrderNo=new.PurchaseOrderNo;
    set sItemNo=new.ItemNo;
    set fShippingQty=new.ShippingQty;
    set sOldSOL_RecordID=old.SOL_RecordID;
    set sOldPurchaseOrderNo=old.PurchaseOrderNo;
    set sOldItemNo=old.ItemNo;
    set fOldShippingQty=old.ShippingQty;

    call Proc_PurchaseOrders_SumShippingQty(sSOL_RecordID,sPurchaseOrderNo,sItemNo);-- 采购合同-出货数量
    if ifNull(sSOL_RecordID,'')<>ifNull(sOldSOL_RecordID,'') or ifNull(sPurchaseOrderNo,'')<>ifNull(sOldPurchaseOrderNo,'') or ifNull(sItemNo,'')<>ifNull(sOldItemNo,'') then
        call Proc_PurchaseOrders_SumShippingQty(sOldSOL_RecordID,sOldPurchaseOrderNo,sOldItemNo);-- 采购合同-出货数量
    end if;
end$
delimiter ;