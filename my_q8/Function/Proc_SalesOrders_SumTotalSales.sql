/*
销售合同-销售总额
*/
delimiter $ 
drop procedure if exists Proc_SalesOrders_SumTotalSales $
create procedure Proc_SalesOrders_SumTotalSales(sCustomer varchar(255)) 
begin
    declare fTotalSales decimal(18,2);
    set fTotalSales=(Select sum(ifnull(TotalSalesAmount,0)) as TotalSalesAmount from SalesOrders Where CustomerNo=sCustomer);
    Update Customers set TotalSales = fTotalSales Where 
        CustomerNo =sCustomer;
end $ 
delimiter ;