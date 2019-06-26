/*
出运明细-产品资料
*/
delimiter $
drop trigger if exists Tgr_ShipmentsLine_AftereUpdate $
create trigger Tgr_ShipmentsLine_AftereUpdate after update
on ShipmentsLine 
for each row
begin
    /*定义变量*/
    declare sNewShippingQty decimal(18,2);
    declare sOldShippingQty decimal(18,2);
    declare sSOL_RecordID varchar(255);
    set sNewShippingQty=new.ShippingQty;
    set sOldShippingQty=old.ShippingQty;
    set sSOL_RecordID=new.SOL_RecordID;
    call Proc_SalesOrders_LsatShipingState(sSOL_RecordID);-- 销售合同-余货不发
    if ifNull(sNewShippingQty,'')<>ifNull(sOldShippingQty,'') then
    call Proc_SalesOrders_SumShippingQty(sSOL_RecordID);-- 销售合同-出货数量
    end if;
end$
delimiter ;