/*
结算中心-索赔金额,未收金额
*/
delimiter $ 
drop procedure if exists Proc_Settlements_SumClaimAmount $
create procedure Proc_Settlements_SumClaimAmount(sInvoiceNO varchar(255)) 
begin
    declare fClaimAmount decimal(18,2);
    set fClaimAmount=(Select Sum(ifnull(PayedAmount,0)) as PayedAmount From Complaints
        Where InvoiceNo=sInvoiceNO);
    Update Settlements set ClaimAmount=ifnull(fClaimAmount,0),RemainAccount=(ifnull(AccountReceivable,0)-ifnull(ReceivedAccount,0)-ifnull(fClaimAmount,0)) Where InvoiceNO=sInvoiceNO;
end $ 
delimiter ;