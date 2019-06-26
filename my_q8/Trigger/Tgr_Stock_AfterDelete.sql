/*
库存信息
*/
delimiter $
drop trigger if exists Tgr_Stock_AftereDelete $
create trigger Tgr_Stock_AftereDelete after delete
on Stock 
for each row
begin
    call Proc_Items_SumStockQTY(old.ItemNO);-- 产品资料-库存数量
end$
delimiter ;