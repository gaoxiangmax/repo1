/*
结算中心-应付保险,未付保险
*/
delimiter $ 
drop procedure if exists Proc_Settlements_LastInsurancePayable $
create procedure Proc_Settlements_LastInsurancePayable(sInvoiceNO varchar(255)) 
begin
    declare fInsurancePayable decimal(18,2);
    set fInsurancePayable=(Select ifnull(InsuranceCosts,0) From Shipments Where InvoiceNo=sInvoiceNO Limit 0,1);
    Update Settlements set InsurancePayable=fInsurancePayable,InsuranceRemain=(fInsurancePayable-ifnull(InsurancePaidUp,0))
        Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;