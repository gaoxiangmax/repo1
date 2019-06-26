/*
结算中心-实际业务毛利
*/
delimiter $ 
drop procedure if exists Proc_Settlements_MathGrossProfit $
create procedure Proc_Settlements_MathGrossProfit(srid varchar(255)) 
begin
    declare fExchangeRate decimal(18,2);
    set fExchangeRate=(Select ExchangeRate From Settlements Where rid=srid);
    if ifNull(fExchangeRate,0)>0 then
        Update Settlements set GrossProfit=((ifnull(ReceivedAccount,0) - ifnull(CommissionPaidUp,0) - ifnull(InsurancePaidUp,0) - ifnull(SeaFreightPaidUp,0) * ifnull(SeaFreightExchangeRate,0) /
        ifnull(ExchangeRate,0) - ifnull(OtherOverseasPaidUp,0)) * ifnull(ExchangeRate,0) - ifnull(MiscellaneousPaidUp,0) - ifnull(ExpressFees,0) - ifnull(OtherDomesticsPaidUp,0) - ifnull(TotalAmountPaidUp,0)
        - ifnull(SampleFeesPaidUp,0) - ifnull(SuppliersOthersPaidUp,0) + ifnull(TaxReceived,0)) Where rid=srid;
    end if;
end $ 
delimiter ;