/*
开票通知-产品资料
*/
delimiter $
drop trigger if exists Tgr_BillNotifiesLine_AftereUpdate $
create trigger Tgr_BillNotifiesLine_AftereUpdate after update
on BillNotifiesLine 
for each row
begin
    /*定义变量*/
    declare srid varchar(255); 
    declare sPurchaseOrderNo varchar(255);
    declare sItemNo varchar(255);
    declare sSOL_RecordID varchar(255);
    declare sOldPurchaseOrderNo varchar(255);
    declare sOldItemNo varchar(255);
    declare sOldSOL_RecordID varchar(255);
    declare fNewBillAmount decimal(18,2);
    declare fOldBillAmount decimal(18,2);
    set srid=new.pid;
    set sPurchaseOrderNo=new.PurchaseOrderNo;
    set sItemNo=new.ItemNo;
    set sSOL_RecordID=new.SOL_RecordID;
    set sOldPurchaseOrderNo=old.PurchaseOrderNo;
    set sOldItemNo=old.ItemNo;
    set sOldSOL_RecordID=old.SOL_RecordID;
    set fNewBillAmount=new.BillAmount;
    set fOldBillAmount=old.BillAmount;
    
    if ifNull(sPurchaseOrderNo,'')<>ifNull(sOldPurchaseOrderNo,'') or ifNull(sItemNo,'')<>ifNull(sOldItemNo,'') or ifNull(sSOL_RecordID,'')<>ifNull(sOldSOL_RecordID,'') or fNewBillAmount<>fOldBillAmount then
        call Proc_Shipments_SumBilledAmount(srid,sPurchaseOrderNo,sItemNo,sSOL_RecordID);-- 出运明细-采购明细-开票金额
        call Proc_Shipments_SumBilledAmount(srid,sOldPurchaseOrderNo,sOldItemNo,sOldSOL_RecordID);-- 出运明细-采购明细-开票金额
    end if;
end$
delimiter ;