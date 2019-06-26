/*
开票通知-产品资料
*/
delimiter $
 drop trigger if exists Tgr_BillNotifiesLine_AftereDelete $
 create trigger Tgr_BillNotifiesLine_AftereDelete after delete
 on BillNotifiesLine 
 for each row
 begin
    call Proc_Shipments_SumBilledAmount(old.pid,old.PurchaseOrderNo,old.ItemNo,old.SOL_RecordID);-- 出运明细-采购明细-开票金额
 end$
 delimiter ;