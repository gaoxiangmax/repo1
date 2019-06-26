/*
出运计划-产品资料
*/
delimiter $
drop trigger if exists Tgr_ShipingPlansLine_AftereUpdate $
create trigger Tgr_ShipingPlansLine_AftereUpdate after update
on ShipingPlansLine 
for each row
begin
    /*定义变量*/
    declare sSOL_RecordID varchar(255); 
    declare sOldSOL_RecordID varchar(255);
    declare fNewShippingQty decimal(18,2);
    declare fOldShippingQty decimal(18,2);
    set sSOL_RecordID=new.SOL_RecordID;
    set sOldSOL_RecordID=old.SOL_RecordID;
    set fNewShippingQty=new.ShippingQty;
    set fOldShippingQty=old.ShippingQty;
    if ifNull(sSOL_RecordID,'')<>ifNull(sOldSOL_RecordID,'') or fNewShippingQty<>fOldShippingQty then
        call Proc_SalesOrders_SumPlanQty(sSOL_RecordID);-- 销售合同-计划数量

        call Proc_SalesOrders_SumPlanQty(sOldSOL_RecordID);-- 销售合同-计划数量
    end if;
end$
delimiter ;