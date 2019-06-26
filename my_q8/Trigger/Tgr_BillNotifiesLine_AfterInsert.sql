/*
开票通知-产品资料
*/
delimiter $
 drop trigger if exists Tgr_BillNotifiesLine_AftereInsert $
 create trigger Tgr_BillNotifiesLine_AftereInsert after insert
 on BillNotifiesLine 
 for each row
 begin
    call Proc_Shipments_SumBilledAmount(new.pid,new.PurchaseOrderNo,new.ItemNo,new.SOL_RecordID);-- 出运明细-采购明细-开票金额
 end$
 delimiter ;