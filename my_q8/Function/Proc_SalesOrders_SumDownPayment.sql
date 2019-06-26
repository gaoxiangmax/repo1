/*
销售合同-已收定金
*/
delimiter $ 
drop procedure if exists Proc_SalesOrders_SumDownPayment $
create procedure Proc_SalesOrders_SumDownPayment(sKeyNo varchar(255)) 
begin
    declare fDownPayment decimal(18,2);
    declare dDate datetime;
    set fDownPayment=(Select Sum(ifnull(IncomesDetail.UsedAmount,0)) as UsedAmount From IncomesDetail Where
    IncomesDetail.CostName='定金' and IncomesDetail.KeyID=sKeyNo);

    set dDate=(Select Max(UsedDate) as dDate From IncomesDetail Where CostName='定金' and KeyID=sKeyNo);

    Update SalesOrders set DownPayment = ifnull(fDownPayment,0) ,DownPaymentDate= ifnull(dDate,Null) Where SalesOrders.SalesOrderNo =sKeyNo;
end $ 
delimiter ;