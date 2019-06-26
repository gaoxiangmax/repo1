/*
销售合同-余货不发
*/
delimiter $ 
drop procedure if exists Proc_SalesOrders_LsatShipingState $
create procedure Proc_SalesOrders_LsatShipingState(sSOL_RecordID varchar(255)) 
begin
    Update SalesOrdersline set ShipingState = ifnull((Select ShipingState From ShipmentsLine
    Where SOL_RecordID=sSOL_RecordID Limit 0,1),'否') Where SalesOrdersline.rid =sSOL_RecordID;
end $ 
delimiter ;