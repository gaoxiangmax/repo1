/*
产品资料-成交总额
*/
delimiter $ 
drop procedure if exists Proc_Items_SumTotalTotalTurnover $
create procedure Proc_Items_SumTotalTotalTurnover(sItemNo varchar(255)) 
begin
    Update Items set TotalTurnover = (Select Sum(ifnull(ConvertUSD,0)) as ConvertUSD from SalesOrdersline where ItemNo=sItemNo) Where ItemNo=sItemNo;
end $ 
delimiter ;