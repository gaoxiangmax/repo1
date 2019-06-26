/*
销售合同-下单数量,未下单数
*/
delimiter $ 
drop procedure if exists Proc_SalesOrders_SumPlaceQty $
create procedure Proc_SalesOrders_SumPlaceQty(sSOL_RecordID varchar(255)) 
begin
    declare fPlaceQty decimal(18,2);
    set fPlaceQty=(Select Sum(ifnull(PurchasePlansLine.OrderQty,0)) as OrderQty From PurchasePlansLine Where
        PurchasePlansLine.SOL_RecordID=sSOL_RecordID);
    Update SalesOrdersline set PlaceQty = ifnull(fPlaceQty,0),UnPlaceQty=(ifnull(OrderQty,0)-ifnull(fPlaceQty,0)) Where 
        SalesOrdersline.rid =sSOL_RecordID;
end $ 
delimiter ;