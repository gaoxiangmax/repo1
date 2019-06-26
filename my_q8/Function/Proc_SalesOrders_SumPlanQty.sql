/*
销售合同-计划数量
*/
delimiter $ 
drop procedure if exists Proc_SalesOrders_SumPlanQty $
create procedure Proc_SalesOrders_SumPlanQty(sSOL_RecordID varchar(255)) 
begin
    declare fPlanQty decimal(18,2);
    set fPlanQty=(Select Sum(ifnull(ShipingPlansLine.ShippingQty,0)) as ShippingQty From ShipingPlansLine Where
        ShipingPlansLine.SOL_RecordID=sSOL_RecordID);
    Update SalesOrdersline set PlanQty = ifnull(fPlanQty,0),UnPlanQty=(ifnull(OrderQty,0)-ifnull(fPlanQty,0)) Where 
        SalesOrdersline.rid =sSOL_RecordID;
end $ 
delimiter ;