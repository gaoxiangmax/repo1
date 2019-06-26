/*
库存信息
*/
delimiter $
drop trigger if exists Tgr_Stock_AftereUpdate $
create trigger Tgr_Stock_AftereUpdate after update
on Stock 
for each row
begin
    /*定义变量*/
    declare sNewItemNO varchar(255); 
    declare sOldItemNO varchar(255); 
    set sNewItemNO=new.ItemNO;
    set sOldItemNO=old.ItemNO;
    call Proc_Items_SumStockQTY(sNewItemNO);-- 产品资料-库存数量
    call Proc_Items_SumStockQTY(sOldItemNO);-- 产品资料-库存数量
end$
delimiter ;