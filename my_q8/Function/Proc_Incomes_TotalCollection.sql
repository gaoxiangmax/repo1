/*
出运明细-收汇总额
*/
delimiter $ 
drop procedure if exists Proc_Incomes_TotalCollection $
create procedure Proc_Incomes_TotalCollection(sCustomerNo varchar(255)) 
begin
    declare fTotalCollection decimal(18,2);
    set fTotalCollection=(Select sum(ifnull(NetAmountExpectedUSD,0)) as NetAmountExpectedUSD from Incomes Where CustomerNo=sCustomerNo);
    Update Customers set TotalCollection = fTotalCollection Where 
        CustomerNo =sCustomerNo;
end $ 
delimiter ;