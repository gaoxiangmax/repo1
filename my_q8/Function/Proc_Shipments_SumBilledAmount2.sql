/*
出运明细-采购明细-开票金额,未开票金额
*/
delimiter $ 
drop procedure if exists Proc_Shipments_SumBilledAmount2 $
create procedure Proc_Shipments_SumBilledAmount2(srid varchar(255),sPurchaseOrderNo varchar(255),sItemNo varchar(255),sSOL_RecordID varchar(255)) 
begin
    declare sInvoiceNO varchar(255);
    declare fBilledAmount decimal(18,2);
    set sInvoiceNO=(Select InvoiceNO From BillNotifies Where rid=srid Limit 0,1);
    set fBilledAmount=(Select Sum(ifnull(BillNotifiesLine.BillAmount,0)) as BillAmount From BillNotifies,BillNotifiesLine Where
    BillNotifies.rid=BillNotifiesLine.pid and BillNotifies.InvoiceNO=sInvoiceNO and BillNotifiesLine.PurchaseOrderNo=sPurchaseOrderNo and 
    BillNotifiesLine.ItemNo=sItemNo and BillNotifiesLine.SOL_RecordID=sSOL_RecordID);

    Update Shipments,ShipmentsDelivery set ShipmentsDelivery.BilledAmount =ifnull(fBilledAmount,0),UnBilledAmount=(ifnull(PurchaseAmount,0)-ifnull(fBilledAmount,0))  Where Shipments.rid=ShipmentsDelivery.pid and Shipments.InvoiceNO=sInvoiceNO and
    ShipmentsDelivery.PurchaseOrderNo=sPurchaseOrderNo and ShipmentsDelivery.ItemNo=sItemNo and ShipmentsDelivery.SOL_RecordID=sSOL_RecordID;
end $ 
delimiter ;