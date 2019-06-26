/*
结算中心-已付保险，未付保险
*/
delimiter $ 
drop procedure if exists Proc_Settlements_SumInsurancePaidUp $
create procedure Proc_Settlements_SumInsurancePaidUp(sInvoiceNO varchar(255)) 
begin
    declare fInsurancePaidUp decimal(18,2);
    declare fCNYInsurancePaidUp decimal(18,2);
    set fInsurancePaidUp=(Select Sum(ifnull(PaymentOverseasDetail.UsedAmount,0)) as UsedAmount From PaymentOverseas,PaymentOverseasDetail
        Where PaymentOverseas.rid=PaymentOverseasDetail.pid and  KeyNo=sInvoiceNO and PaymentOverseas.CostName='保险费');

    set fCNYInsurancePaidUp=(Select Sum(ifnull(PaymentOverseasDetail.UsedAmountRMB,0)) as UsedAmount From PaymentOverseas,PaymentOverseasDetail
        Where PaymentOverseas.rid=PaymentOverseasDetail.pid and  KeyNo=sInvoiceNO and PaymentOverseas.CostName='保险费');

    Update Settlements set InsurancePaidUp=ifnull(fInsurancePaidUp,0),InsuranceRemain=(ifnull(InsurancePayable,0)-ifnull(fInsurancePaidUp,0)),CNYInsurancePaidUp=ifnull(fCNYInsurancePaidUp,0) Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;