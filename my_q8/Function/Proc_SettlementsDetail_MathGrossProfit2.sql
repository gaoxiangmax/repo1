/*
结算中心-实际业务毛利
*/
delimiter $ 
drop procedure if exists Proc_SettlementsDetail_MathGrossProfit2 $
create procedure Proc_SettlementsDetail_MathGrossProfit2(srid varchar(255)) 
begin
    declare fTotalAmountPaidUp,fTotalAmountRemain decimal(18,2);
    set fTotalAmountPaidUp=(Select Sum(ifnull(CNYTotalPaidUp,0)) As yj
                                    From   SettlementsDetail,
                                            Settlements
                                    Where  SettlementsDetail.pid = Settlements.rid
                                            And SettlementsDetail.pid =srid);
    set fTotalAmountRemain=(Select Sum(ifnull(CNYSuppliersRemain,0)) As yj
                                    From   SettlementsDetail,
                                            Settlements
                                    Where  SettlementsDetail.pid = Settlements.rid
                                            And SettlementsDetail.pid = srid);
    Update Settlements Set TotalAmountPaidUp = fTotalAmountPaidUp,TotalAmountRemain = fTotalAmountRemain,
    GrossProfit=((ifnull(ReceivedAccount,0) - ifnull(CommissionPaidUp,0) - ifnull(InsurancePaidUp,0) - ifnull(SeaFreightPaidUp,0) * ifnull(SeaFreightExchangeRate,0) /
        ifnull(ExchangeRate,0) - ifnull(OtherOverseasPaidUp,0)) * ifnull(ExchangeRate,0) - ifnull(MiscellaneousPaidUp,0) - ifnull(ExpressFees,0) - ifnull(OtherDomesticsPaidUp,0) - fTotalAmountPaidUp
        - ifnull(SampleFeesPaidUp,0) - ifnull(SuppliersOthersPaidUp,0) + ifnull(TaxReceived,0)) Where rid = srid;
end $ 
delimiter ;