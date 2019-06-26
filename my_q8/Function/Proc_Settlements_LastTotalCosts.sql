/*
结算中心-费用合计,应收货款,未收金额
*/
delimiter $ 
drop procedure if exists Proc_Settlements_LastTotalCosts $
create procedure Proc_Settlements_LastTotalCosts(sInvoiceNO varchar(255)) 
begin
    declare fTotalCosts decimal(18,2);
    set fTotalCosts=(Select ifnull(TotalCosts,0) From Shipments Where InvoiceNo=sInvoiceNO Limit 0,1);
    Update Settlements set TotalCosts=fTotalCosts,AccountReceivable=(ifnull(TotalSalesAmount,0)+fTotalCosts),
    RemainAccount=(ifnull(TotalSalesAmount,0)+fTotalCosts-ifnull(ReceivedAccount,0)-ifnull(ClaimAmount,0))
        Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;