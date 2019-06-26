/*
产品资料-库存数量
*/
delimiter $ 
drop procedure if exists Proc_Items_SumStockQTY $
create procedure Proc_Items_SumStockQTY(sItemNo varchar(255)) 
begin
    Update Items set StockQTY = (Select Sum(ifnull(QTY,0)) as QTY from Stock where ItemNo=sItemNo) Where ItemNo=sItemNo;
end $ 
delimiter ;