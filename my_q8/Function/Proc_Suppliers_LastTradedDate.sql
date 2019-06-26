/*
工厂资料-最近成交
*/
delimiter $ 
drop procedure if exists Proc_Suppliers_LastTradedDate $
create procedure Proc_Suppliers_LastTradedDate(sSupplierNo varchar(255)) 
begin
    Update Suppliers set LastTradedDate = (Select OrderDate From PurchaseOrders Where SupplierNo=sSupplierNo Order By sid Desc Limit 0,1) Where Suppliers.SupplierNo = sSupplierNo;
end $ 
delimiter ;