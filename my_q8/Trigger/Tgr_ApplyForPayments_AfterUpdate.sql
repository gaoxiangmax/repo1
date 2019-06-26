/*
付款申请-费用明细
*/
delimiter $
drop trigger if exists Tgr_ApplyForPayments_AftereUpdate $
create trigger Tgr_ApplyForPayments_AftereUpdate after update
on ApplyForPayments 
for each row
begin
    /*定义变量*/
    declare srid varchar(255);
    declare sNewCostName varchar(255);
    declare sOldCostName varchar(255);
    declare sNewPaymentType varchar(255);
    declare sOldPaymentType varchar(255);
    set srid=new.rid;
    set sNewCostName=new.CostName;
    set sOldCostName=old.CostName;
    set sNewPaymentType=new.PaymentType;
    set sOldPaymentType=old.PaymentType;
    begin
        /*定义变量*/
        declare sKeyNo varchar(255);
        declare sKeyModaul varchar(255);
        /*定义结束标志变量*/
        declare Done2 int default 0;
        /*定义游标 以及赋值*/
        declare Cursor_ApplyForPaymentsDetail_AftereInsert cursor for 
        Select KeyNo,KeyModaul From ApplyForPaymentsDetail Where pid=srid;
        /*指定游标循环结束时的返回值 */
        declare continue handler for not found set Done2 =1; 
        /*打开游标*/
        open Cursor_ApplyForPaymentsDetail_AftereInsert;
        /*循环开始*/
        flag_loop_ApplyForPaymentsDetail:loop
        /*给游标变量赋值*/
        fetch Cursor_ApplyForPaymentsDetail_AftereInsert into sKeyNo,sKeyModaul; 
        /*判断游标的循环是否结束*/
        if Done2 then 
            leave flag_loop_ApplyForPaymentsDetail ; 
        end if ;
            if ifNull(sNewCostName,'')<>ifNull(sOldCostName,'') then
            if ifNull(sKeyModaul,'')='收样管理' then
                call Proc_ReceiveSamples_SumAppliedChargeed2(sKeyNo);-- 收样管理-已申快件费
                call Proc_ReceiveSamples_SumAppliedForPayment2(sKeyNo);-- 收样管理-已申请样品费
            end if;
            if ifNull(sKeyModaul,'')='开票通知' then
                call Proc_BillNotifies_AppliedForPayment1(sKeyNo);-- 开票通知-已申请货款
            end if;
            if ifNull(sKeyModaul,'')='寄样管理' then
                call Proc_SendSamples_SumAppliedForPayment2(sKeyNo);-- 寄样管理-已申请付款
            end if;
            end if;
            if ifNull(sNewPaymentType,'')<>ifNull(sOldPaymentType,'') then
            if ifNull(sKeyModaul,'')='出运明细' then
                call Proc_Shipments_SumAppliedForOverSeas2(sKeyNo);-- 出运明细-已申请国外
                call Proc_Shipments_SumAppliedForDomestic2(sKeyNo);-- 出运明细-已申请国内
            end if;
            end if;
            if ifNull(sNewCostName,'')<>ifNull(sOldCostName,'') or ifNull(sNewPaymentType,'')<>ifNull(sOldPaymentType,'') then
            if ifNull(sKeyModaul,'')='采购合同' then
                call Proc_PurchaseOrders_AppliedForPayment2(sKeyNo);-- 采购合同-已申请定金
            end if;
            end if;
        end loop;  /*循环结束*/
        close Cursor_ApplyForPaymentsDetail_AftereInsert;/*关闭游标*/
    end;
end$
delimiter ;