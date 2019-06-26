/*
结算中心-是否已退税
*/
delimiter $ 
drop procedure if exists Proc_Settlements_LastRetired $
create procedure Proc_Settlements_LastRetired(sInvoiceNO varchar(255)) 
begin
    Update Settlements set Retired=ifnull((Select Retired From ExportRebatesDetail Where InvoiceNO=sInvoiceNO Limit 0,1),0)
        Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;