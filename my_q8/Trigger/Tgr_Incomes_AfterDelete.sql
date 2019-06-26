/*
客户收汇
*/
delimiter $
drop trigger if exists Tgr_Incomes_AftereDelete $
create trigger Tgr_Incomes_AftereDelete after delete
on Incomes 
for each row
begin
    call Proc_Incomes_TotalCollection(old.CustomerNo);
end$
delimiter ;