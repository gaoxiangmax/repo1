/*
结算中心-船代公司
*/
delimiter $ 
drop procedure if exists Proc_Settlements_LastForwarder $
create procedure Proc_Settlements_LastForwarder(sInvoiceNO varchar(255)) 
begin
    Update Settlements set Forwarder=ifnull((Select Forwarder From Shipments
        Where InvoiceNo=sInvoiceNO Limit 0,1),'') Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;