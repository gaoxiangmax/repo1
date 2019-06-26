/*
客诉管理
*/
delimiter $
drop trigger if exists Tgr_Complaints_AftereDelete $
create trigger Tgr_Complaints_AftereDelete after delete
on Complaints 
for each row
begin
    call Proc_Settlements_SumClaimAmount(old.InvoiceNO);-- 结算中心-索赔金额
    call Proc_Settlements_MathGrossProfit(old.rid);-- 结算中心-实际业务毛利
end$
delimiter ;