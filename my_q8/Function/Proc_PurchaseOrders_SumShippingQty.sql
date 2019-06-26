/*
采购合同-出货数量,未出货数
*/
delimiter $ 
drop procedure if exists Proc_PurchaseOrders_SumShippingQty $
create procedure Proc_PurchaseOrders_SumShippingQty(sSOL_RecordID char(100),sPurchaseOrderNo char(100),sItemNo char(100)) 
begin
    declare fShippingQty decimal(18,2);
    set fShippingQty=(Select Sum(ifnull(ShipmentsDelivery.ShippingQty,0)) as ShippingQty From ShipmentsDelivery Where
    ShipmentsDelivery.SOL_RecordID=sSOL_RecordID and ShipmentsDelivery.PurchaseOrderNo=sPurchaseOrderNo and ShipmentsDelivery.ItemNo=sItemNo);

    Update PurchaseOrders,PurchaseOrdersLine set PurchaseOrdersLine.ShippingQty =ifnull(fShippingQty,0),UnShippingQty=(ifnull(OrderQty,0)-ifnull(fShippingQty,0))  Where 
    PurchaseOrders.rid=PurchaseOrdersLine.pid and PurchaseOrders.PurchaseOrderNo=sPurchaseOrderNo and PurchaseOrdersLine.ItemNo=sItemNo and
        PurchaseOrdersLine.SOL_RecordID =sSOL_RecordID;
end $ 
delimiter ;