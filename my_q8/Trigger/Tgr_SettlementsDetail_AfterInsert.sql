/*
结算中心
*/
delimiter $
drop trigger if exists Tgr_SettlementsDetail_AftereInsert $
create trigger Tgr_SettlementsDetail_AftereInsert after insert
on SettlementsDetail 
for each row
begin
    call Proc_Settlements_MathGrossProfit(new.rid);-- 结算中心-实际业务毛利
end$
delimiter ;