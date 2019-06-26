/*
出运明细-产品资料
*/
delimiter $
drop trigger if exists Tgr_ShipmentsLine_AftereDelete $
create trigger Tgr_ShipmentsLine_AftereDelete after delete
on ShipmentsLine 
for each row
begin
    /*定义变量*/
    declare sSOL_RecordID varchar(255);
    set sSOL_RecordID=old.SOL_RecordID;
    call Proc_SalesOrders_LsatShipingState(sSOL_RecordID);-- 销售合同-余货不发
    call Proc_SalesOrders_SumShippingQty(sSOL_RecordID);-- 销售合同-出货数量
end$
delimiter ;