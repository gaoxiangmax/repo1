/*
结算中心-货值合计,应收货款
*/
delimiter $ 
drop procedure if exists Proc_Settlements_LastTotalSalesAmount $
create procedure Proc_Settlements_LastTotalSalesAmount(sInvoiceNO varchar(255)) 
begin
    declare fTotalSalesAmount decimal(18,2);
    set fTotalSalesAmount=(Select ifnull(TotalSalesAmount,0) From Shipments Where InvoiceNo=sInvoiceNO Limit 0,1);
    Update Settlements set TotalSalesAmount=fTotalSalesAmount,AccountReceivable=(ifnull(TotalCosts,0)+fTotalSalesAmount),
    RemainAccount=(fTotalSalesAmount+ifnull(TotalCosts,0)-ifnull(ReceivedAccount,0)-ifnull(ClaimAmount,0))
        Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;