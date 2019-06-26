/*
客户资料-最近报价
*/
delimiter $ 
drop procedure if exists Proc_Customers_LastQuotation $
create procedure Proc_Customers_LastQuotation(sCustomerNo varchar(255)) 
begin
    declare dLastQuotation date;
    set dLastQuotation=(Select QuotationDate From Quotations Where CustomerNo=sCustomerNo Order By sid Desc Limit 0,1);
    Update Customers set LastQuotation =dLastQuotation  Where Customers.CustomerNo = sCustomerNo;
end $ 
delimiter ;