/*
客户收汇
*/
delimiter $
drop trigger if exists Tgr_Incomes_AftereInsert $
create trigger Tgr_Incomes_AftereInsert after insert
on Incomes 
for each row
begin
    call Proc_Incomes_TotalCollection(new.CustomerNo);
end$
delimiter ;