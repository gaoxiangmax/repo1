/*
结算中心-已收货款,未收金额
*/
delimiter $ 
drop procedure if exists Proc_Settlements_SumReceivedAccount $
create procedure Proc_Settlements_SumReceivedAccount(sInvoiceNO varchar(255)) 
begin
    declare fReceivedAccount decimal(18,2);
    set fReceivedAccount=(Select Sum(ifnull(UsedAmount,0)) as UsedAmount From IncomesDetail
        Where InvoiceNO=sInvoiceNO);
    Update Settlements set ReceivedAccount=ifnull(fReceivedAccount,0),RemainAccount=(ifnull(AccountReceivable,0)-ifnull(fReceivedAccount,0)-ifnull(ClaimAmount,0)) Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;