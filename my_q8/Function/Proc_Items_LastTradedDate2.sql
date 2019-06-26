/*
产品资料-最近成交
*/
delimiter $ 
drop procedure if exists Proc_Items_LastTradedDate2 $
create procedure Proc_Items_LastTradedDate2(sItemNo varchar(255)) 
begin
    Update Items set LastTradedDate = (Select SalesOrders.OrderDate From SalesOrders,SalesOrdersline Where SalesOrders.rid=SalesOrdersline.pid and
        SalesOrdersline.ItemNo=sItemNo Order By SalesOrders.sid Desc Limit 0,1) Where ItemNo=sItemNo;
end $ 
delimiter ;