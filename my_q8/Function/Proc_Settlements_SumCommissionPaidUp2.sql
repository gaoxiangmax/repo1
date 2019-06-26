/*
结算中心-已付佣金，未付佣金
*/
delimiter $ 
drop procedure if exists Proc_Settlements_SumCommissionPaidUp2 $
create procedure Proc_Settlements_SumCommissionPaidUp2(sInvoiceNO varchar(255)) 
begin
    declare fCommissionPaidUp decimal(18,2);
    declare fCNYCommissionPaidUp decimal(18,2);
    set fCommissionPaidUp=(Select Sum(ifnull(PaymentOverseasDetail.UsedAmount,0)) as UsedAmount From PaymentOverseas,PaymentOverseasDetail
        Where PaymentOverseas.rid=PaymentOverseasDetail.pid and  KeyNo=sInvoiceNO and PaymentOverseas.CostName='佣金');

        set fCNYCommissionPaidUp=(Select Sum(ifnull(PaymentOverseasDetail.UsedAmountRMB,0)) as UsedAmount From PaymentOverseas,PaymentOverseasDetail
        Where PaymentOverseas.rid=PaymentOverseasDetail.pid and  KeyNo=sInvoiceNO and PaymentOverseas.CostName='佣金');

    Update Settlements set CommissionPaidUp=ifnull(fCommissionPaidUp,0),CommissionRemain=(ifnull(CommissionPayable,0)-ifnull(fCommissionPaidUp,0)),CNYCommissionPaidUp=ifnull(fCNYCommissionPaidUp,0) Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;