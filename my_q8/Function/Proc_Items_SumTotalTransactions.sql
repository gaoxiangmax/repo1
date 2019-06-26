/*
产品资料-成交总量
*/
delimiter $ 
drop procedure if exists Proc_Items_SumTotalTransactions $
create procedure Proc_Items_SumTotalTransactions(sItemNo varchar(255)) 
begin
    Update Items set TotalTransactions = (Select Sum(ifnull(OrderQty,0)) as OrderQty from SalesOrdersline where ItemNo=sItemNo) Where ItemNo=sItemNo;
end $ 
delimiter ;