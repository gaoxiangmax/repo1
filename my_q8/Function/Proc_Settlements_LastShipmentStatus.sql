/*
结算中心-出运状态
*/
delimiter $ 
drop procedure if exists Proc_Settlements_LastShipmentStatus $
create procedure Proc_Settlements_LastShipmentStatus(sInvoiceNO varchar(255)) 
begin
    Update Settlements set ShipmentStatus=ifnull((Select ShipmentStatus From Shipments
        Where InvoiceNo=sInvoiceNO Limit 0,1),'') Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;