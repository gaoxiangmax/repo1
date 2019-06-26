/*
客户资料-最近成交
*/
delimiter $ 
drop procedure if exists Proc_Customers_LastTradedDate $
create procedure Proc_Customers_LastTradedDate(sCustomerNo varchar(255)) 
begin
    Update Customers set LastTradedDate = (Select OrderDate From SalesOrders Where CustomerNo=sCustomerNo Order By sid Desc Limit 0,1)
        Where Customers.CustomerNo = sCustomerNo;
end $ 
delimiter ;