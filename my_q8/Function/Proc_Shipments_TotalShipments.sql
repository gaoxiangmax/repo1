/*
出运明细-出货总额
*/
delimiter $ 
drop procedure if exists Proc_Shipments_TotalShipments $
create procedure Proc_Shipments_TotalShipments(sCustomerNo varchar(255)) 
begin
    declare fTotalShipments decimal(18,2);
    set fTotalShipments=(Select sum(ifnull(TotalSalesAmount,0)) as TotalSalesAmount from Shipments Where CustomerNo=sCustomerNo);
    Update Customers set TotalShipments = ifnull(fTotalShipments,0) Where 
        CustomerNo =sCustomerNo;
end $ 
delimiter ;