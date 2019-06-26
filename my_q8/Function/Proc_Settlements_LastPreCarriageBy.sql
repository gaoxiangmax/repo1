/*
结算中心-前程运输
*/
delimiter $ 
drop procedure if exists Proc_Settlements_LastPreCarriageBy $
create procedure Proc_Settlements_LastPreCarriageBy(sInvoiceNO varchar(255)) 
begin
    Update Settlements set PreCarriageBy=ifnull((Select PreCarriageBy From Shipments
        Where InvoiceNo=sInvoiceNO Limit 0,1),'') Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;