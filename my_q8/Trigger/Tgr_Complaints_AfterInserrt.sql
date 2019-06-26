/*
客诉管理
*/
delimiter $
drop trigger if exists Tgr_Complaints_AftereInserrt $
create trigger Tgr_Complaints_AftereInserrt after insert
on Complaints 
for each row
begin
    call Proc_Settlements_SumClaimAmount(new.InvoiceNO);-- 结算中心-索赔金额
end$
delimiter ;