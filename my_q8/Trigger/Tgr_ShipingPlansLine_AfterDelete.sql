/*
出运计划-产品资料
*/
delimiter $
drop trigger if exists Tgr_ShipingPlansLine_AftereDelete $
create trigger Tgr_ShipingPlansLine_AftereDelete after delete
on ShipingPlansLine 
for each row
begin
    call Proc_SalesOrders_SumPlanQty(old.SOL_RecordID);-- 销售合同-计划数量
end$
delimiter ;