/*
工厂付款
*/
delimiter $
drop trigger if exists Tgr_Payments_AftereUpdate $
create trigger Tgr_Payments_AftereUpdate after update
on Payments
for each row
begin
    /*定义变量*/
    declare srid varchar(255); 
    declare sNewCostName varchar(255);
    declare sOldCostName varchar(255);
    declare sNewID varchar(255);
    declare sOldID varchar(255);
    declare fNewAmount decimal(18,2);
    declare fOldAmount decimal(18,2);

    set srid=new.rid;
    set sNewCostName=new.CostName;
    set sOldCostName=old.CostName;
    set sNewID=new.ID;
    set sOldID=old.ID;
    set fNewAmount=new.Amount;
    set fOldAmount=old.Amount;
    if ifNull(sNewID,'')<>ifNull(sOldID,'') or fNewAmount<>fOldAmount then
        call Proc_ApplyForPayments_Payments_UnPaiedAmount(sNewID);-- 付款申请-工厂付款
        call Proc_ApplyForPayments_Payments_UnPaiedAmount(sOldID);-- 付款申请-工厂付款
    end if;

    if ifNull(sNewCostName,'')<>ifNull(sOldCostName,'') then
        begin
            /*定义变量*/
            declare sKeyNo varchar(255);
            declare sInvoiceNO varchar(255); 
            declare SettlementsRid varchar(255);
            /*定义结束标志变量*/
            declare Done int default 0;
            /*定义游标 以及赋值*/
            declare Cursor_Payments_AftereUpdate_PaymentsDetail cursor for 
            Select KeyNo,InvoiceNO From PaymentsDetail Where pid=srid;
            /*指定游标循环结束时的返回值 */
            declare continue handler for not found set Done =1; 
            /*打开游标*/
            open Cursor_Payments_AftereUpdate_PaymentsDetail;
            /*循环开始*/
            flag_loop_PaymentsDetail:loop
            /*给游标变量赋值*/
            fetch Cursor_Payments_AftereUpdate_PaymentsDetail into sKeyNo,sInvoiceNO; 
            /*判断游标的循环是否结束*/
            if Done then 
                leave flag_loop_PaymentsDetail ; 
            end if ;
                call Proc_PurchaseOrders_SumDownPayment2(sKeyNo);-- 采购合同-已付定金、定金日期
                call Proc_PurchaseOrders_AmountPaid2(sKeyNo);-- 采购合同-已付货款
                call Proc_ReceiveSamples_SumPaySampleFees2(sKeyNo);-- 收样管理-已付样品费
                set SettlementsRid=(Select rid From Settlements Where InvoiceNO=sInvoiceNO Limit 0,1);
                call Proc_Settlements_SumDownPaymentPaidUp2(sInvoiceNO,sKeyNo);-- 结算中心-工厂付款-已付定金
                call Proc_Settlements_SumAmountPaid2(sInvoiceNO,sKeyNo);-- 结算中心-工厂付款-已付货款  
                call Proc_Settlements_SumSampleFeesPaidUp2(sInvoiceNO);-- 结算中心-已付样品费   
                call Proc_Settlements_SumSuppliersOthersPaidUp2(sInvoiceNO);-- 结算中心-已付其他费用
                call Proc_SettlementsDetail_MathGrossProfit2(SettlementsRid);-- 结算中心-实际业务毛利
            end loop;  /*循环结束*/
            close Cursor_Payments_AftereUpdate_PaymentsDetail;/*关闭游标*/
        end;
    end if;  
end$
delimiter ;