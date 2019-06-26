/*
结算中心
*/
delimiter $
drop trigger if exists Tgr_SettlementsDetail_AftereDelete $
create trigger Tgr_SettlementsDetail_AftereDelete after delete
on SettlementsDetail 
for each row
begin
    call Proc_Settlements_MathGrossProfit(old.rid);-- 结算中心-实际业务毛利
end$
delimiter ;