/*
结算中心-应付海运,未付海运
*/
delimiter $ 
drop procedure if exists Proc_Settlements_LastSeaFreightPayable $
create procedure Proc_Settlements_LastSeaFreightPayable(sInvoiceNO varchar(255)) 
begin
    declare fSeaFreightPayable decimal(18,2);
    set fSeaFreightPayable=(Select ifnull(SeaFreight,0) From Shipments Where InvoiceNo=sInvoiceNO Limit 0,1);
    Update Settlements set SeaFreightPayable=fSeaFreightPayable,SeaFreightRemain=(fSeaFreightPayable-ifnull(SeaFreightPaidUp,0))
        Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;