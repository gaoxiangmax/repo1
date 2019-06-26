/*
开票通知-产品资料
*/
delimiter $
drop trigger if exists Tgr_BillNotifies_AftereUpdate $
create trigger Tgr_BillNotifies_AftereUpdate after update
on BillNotifies 
for each row
begin
    /*定义变量*/
    declare srid varchar(255); 
    declare sNewInvoiceNO varchar(255);
    declare sOldInvoiceNO varchar(255);
    set srid=new.rid;
    set sNewInvoiceNO=new.InvoiceNO;
    set sOldInvoiceNO=old.InvoiceNO;
    begin
        /*定义变量*/
        declare sPurchaseOrderNo varchar(255);
        declare sItemNo varchar(255);
        declare sSOL_RecordID varchar(255);
        /*定义结束标志变量*/
        declare Done2 int default 0;
        /*定义游标 以及赋值*/
        declare Cursor_BillNotifies_AftereUpdate_BillNotifiesLine cursor for 
        Select PurchaseOrderNo,ItemNo,SOL_RecordID From BillNotifiesLine Where pid=srid;
        /*指定游标循环结束时的返回值 */
        declare continue handler for not found set Done2 =1; 
        /*打开游标*/
        open Cursor_BillNotifies_AftereUpdate_BillNotifiesLine;
        /*循环开始*/
        flag_loop_BillNotifiesLine:loop
        /*给游标变量赋值*/
        fetch Cursor_BillNotifies_AftereUpdate_BillNotifiesLine into sPurchaseOrderNo,sItemNo,sSOL_RecordID; 
        /*判断游标的循环是否结束*/
        if Done2 then 
        leave flag_loop_BillNotifiesLine ; 
        end if ;
        call Proc_Shipments_SumBilledAmount2(srid,sPurchaseOrderNo,sItemNo,sSOL_RecordID);-- 出运明细-采购明细-开票金额
        end loop;  /*循环结束*/
        close Cursor_BillNotifies_AftereUpdate_BillNotifiesLine;/*关闭游标*/
    end;
end$
delimiter ;