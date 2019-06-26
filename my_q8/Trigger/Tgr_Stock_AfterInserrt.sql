/*
库存信息
*/
delimiter $
drop trigger if exists Tgr_Stock_AftereInserrt $
create trigger Tgr_Stock_AftereInserrt after insert
on Stock 
for each row
begin
    call Proc_Items_SumStockQTY(new.ItemNO);-- 产品资料-库存数量
end$
delimiter ;