/*
客户资料-最近寄样
*/
delimiter $ 
drop procedure if exists Proc_Customers_LastSend2 $
create procedure Proc_Customers_LastSend2(sCustomerNo varchar(60)) 
begin
    Update Customers set LastSend = (Select SendDate From SendSamples Where PartnerNo=sCustomerNo Order By sid Desc Limit 0,1) Where Customers.CustomerNo = sCustomerNo;
end $ 
delimiter ;