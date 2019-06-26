/*
销售合同-产品资料
*/
delimiter $
drop trigger if exists Tgr_SalesOrdersline_AftereUpdate $
create trigger Tgr_SalesOrdersline_AftereUpdate after update
on SalesOrdersline 
for each row
begin
    /*定义变量*/
    declare sNewItemNo varchar(255); 
    declare sOldItemNo varchar(255);
    declare fNewConvertUSD decimal(18,2);
    declare fOldConvertUSD decimal(18,2);
    declare fNewOrderQty decimal(18,2);
    declare fOldOrderQty decimal(18,2);
    set sNewItemNo=new.ItemNo;
    set sOldItemNo=old.ItemNo;
    set fNewConvertUSD=new.ConvertUSD;
    set fOldConvertUSD=old.ConvertUSD;
    set fNewOrderQty=new.OrderQty;
    set fOldOrderQty=old.OrderQty;
    if ifNull(sNewItemNo,'')<>ifNull(sOldItemNo,'') then
        call Proc_Items_LastTradedDate(sNewItemNo);-- 客户资料-最近推荐 
        call Proc_Items_LastTradedDate(sOldItemNo);-- 客户资料-最近推荐 
        call Proc_Items_SumTotalTotalTurnover(sNewItemNo);-- 产品资料-成交总额
        call Proc_Items_SumTotalTotalTurnover(sOldItemNo);-- 产品资料-成交总额
        call Proc_Items_SumTotalTransactions(sNewItemNo);-- 产品资料-成交总量
        call Proc_Items_SumTotalTransactions(sOldItemNo);-- 产品资料-成交总量
    end if;
end$
/*恢复结束符为;*/
delimiter ;