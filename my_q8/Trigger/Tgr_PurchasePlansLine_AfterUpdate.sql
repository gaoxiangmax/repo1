/*
采购计划-产品资料
*/
delimiter $
drop trigger if exists Tgr_PurchasePlansLine_AftereUpdate $
create trigger Tgr_PurchasePlansLine_AftereUpdate after update
on PurchasePlansLine 
for each row
begin
    /*定义变量*/
    declare sSOL_RecordID varchar(255); 
    declare sOldSOL_RecordID varchar(255);
    declare fNewOrderQty decimal(18,2);
    declare fOldOrderQty decimal(18,2); 
    set sSOL_RecordID=new.SOL_RecordID;
    set sOldSOL_RecordID=old.SOL_RecordID;
    set fNewOrderQty=new.OrderQty;
    set fOldOrderQty=old.OrderQty;
    if ifNull(sSOL_RecordID,'')<>ifNull(sOldSOL_RecordID,'') or fNewOrderQty<>fOldOrderQty then
        call Proc_SalesOrders_SumPlaceQty(sSOL_RecordID);-- 销售合同-下单数量

        call Proc_SalesOrders_SumPlaceQty(sOldSOL_RecordID);-- 销售合同-下单数量
    end if;
end$
delimiter ;