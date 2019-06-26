/*
采购计划-采购明细-采购合同，更新最后的采购合同号码....暂时弃用
*/
delimiter $ 
drop procedure if exists Proc_PurchasePlans_PurchasePlansDelivery_LastPurchaseOrderNo $
create procedure Proc_PurchasePlans_PurchasePlansDelivery_LastPurchaseOrderNo(spid varchar(255)) 
begin
    begin
        declare sPurchasePlanNo varchar(255);
        declare srid varchar(255);
        declare sSupplierNo varchar(255);
        declare sItemNo varchar(255);
        declare sSOL_RecordID varchar(255);
        declare sPurchaseOrderNo varchar(255);
        
        /*定义结束标志变量*/
        declare Done int default 0;
        /*定义游标 以及赋值*/
        declare Cursor_PurchasePlans_PurchasePlansDelivery_LastPurchaseOrderNo cursor for 
            Select
                PurchasePlans.PurchasePlanNo,
                PurchasePlansDelivery.rid,
                PurchasePlansDelivery.SupplierNo,
                PurchasePlansDelivery.ItemNo,
                PurchasePlansDelivery.SOL_RecordID
            From
                PurchasePlans,
                PurchasePlansDelivery
            Where PurchasePlans.rid = PurchasePlansDelivery.pid
            and PurchasePlansDelivery.pid=spid;
        /*指定游标循环结束时的返回值 */
        declare continue handler for not found set Done =1; 
        /*打开游标*/
        open Cursor_PurchasePlans_PurchasePlansDelivery_LastPurchaseOrderNo;
        /*循环开始*/
        flag_loop_PurchasePlans_PurchasePlansDelivery_LastPurchaseOrderNo:loop
        /*给游标变量赋值*/
        fetch Cursor_PurchasePlans_PurchasePlansDelivery_LastPurchaseOrderNo into sPurchasePlanNo,srid,sSupplierNo,sItemNo,sSOL_RecordID; 
        /*判断游标的循环是否结束*/
        if Done then 
            leave flag_loop_PurchasePlans_PurchasePlansDelivery_LastPurchaseOrderNo ; 
        end if ;
            set sPurchaseOrderNo=(Select ifNull(PurchaseOrders.PurchaseOrderNo,'undefined') as PurchaseOrderNo
                From PurchaseOrders, PurchaseOrdersLine
                Where PurchaseOrders.rid=PurchaseOrdersLine.pid and PurchaseOrders.PurchasePlanNo=sPurchasePlanNo
                    and PurchaseOrders.SupplierNo= sSupplierNo
                    and PurchaseOrdersLine.ItemNo= sItemNo
                    and PurchaseOrdersLine.SOL_RecordID=sSOL_RecordID Limit 1);
            if sPurchaseOrderNo<>'undefined' then
                Update PurchasePlansDelivery Set PurchaseOrderNo=sPurchaseOrderNo Where rid=srid;
            else
                Update PurchasePlansDelivery Set PurchaseOrderNo='' Where rid=srid;
            end if;
        end loop;  /*循环结束*/
        close Cursor_PurchasePlans_PurchasePlansDelivery_LastPurchaseOrderNo;/*关闭游标*/
    end;
end $ 
delimiter ;