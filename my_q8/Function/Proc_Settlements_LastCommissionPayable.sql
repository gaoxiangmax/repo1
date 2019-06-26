/*
结算中心-应付佣金，未付佣金
*/
delimiter $ 
drop procedure if exists Proc_Settlements_LastCommissionPayable $
create procedure Proc_Settlements_LastCommissionPayable(sInvoiceNO varchar(255)) 
begin
    declare fCommissionPayable decimal(18,2);
    set fCommissionPayable=(Select ifnull(Commission,0) From Shipments Where InvoiceNo=sInvoiceNO Limit 0,1);
    Update Settlements set CommissionPayable=fCommissionPayable,CommissionRemain=(fCommissionPayable-ifnull(CommissionPaidUp,0))
        Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;