/*
销售合同-出货数量
*/
delimiter $ 
drop procedure if exists Proc_SalesOrders_SumShippingQty $
create procedure Proc_SalesOrders_SumShippingQty(sSOL_RecordID varchar(255)) 
begin
    declare fShippingQty decimal(18,2);
    set fShippingQty=(Select Sum(ifnull(ShipmentsLine.ShippingQty,0)) as ShippingQty From ShipmentsLine Where
        ShipmentsLine.SOL_RecordID=sSOL_RecordID);
    Update SalesOrdersline set ShippingQty = ifnull(fShippingQty,0),UnShippingQty=(ifnull(OrderQty,0)-ifnull(fShippingQty,0)) Where 
        SalesOrdersline.rid =sSOL_RecordID;
end $ 
delimiter ;