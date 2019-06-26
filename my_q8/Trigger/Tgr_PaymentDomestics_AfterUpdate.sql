/*
国内费用
*/
delimiter $
drop trigger if exists Tgr_PaymentDomestics_AftereUpdate $
create trigger Tgr_PaymentDomestics_AftereUpdate after update
on PaymentDomestics 
for each row
begin
    /*定义变量*/
    declare srid varchar(255);
    declare sNewCostName varchar(255);
    declare sOldCostName varchar(255); 
    declare sNewID varchar(255);
    declare sOldID varchar(255);
    declare fNewPayAmount decimal(18,2);
    declare fOldPayAmount decimal(18,2);

    set srid=new.rid;
    set sNewCostName=new.CostName;
    set sOldCostName=old.CostName;
    set sNewID=new.ID;
    set sOldID=old.ID;
    set fNewPayAmount=new.PayAmount;
    set fOldPayAmount=old.PayAmount;
    if ifNull(sNewID,'')<>ifNull(sOldID,'') or fNewPayAmount<>fOldPayAmount then
        call Proc_ApplyForPayments_PaymentDomestics_UnPaiedAmount(sNewID);-- 付款申请-国内费用
        call Proc_ApplyForPayments_PaymentDomestics_UnPaiedAmount(sOldID);-- 付款申请-国内费用
    end if;

    if ifNull(sNewCostName,'')<>ifNull(sOldCostName,'') then
        begin
        /*定义变量*/
        declare sKeyNo varchar(255);
        declare sInvoiceNO varchar(255);
        declare sSettlementsRid varchar(255);
        /*定义结束标志变量*/
        declare Done2 int default 0;
        /*定义游标 以及赋值*/
        declare Cursor_PaymentDomestics_AftereUpdate cursor for 
        Select KeyNo,InvoiceNO From PaymentDomesticsDetail Where pid=srid;
        /*指定游标循环结束时的返回值 */
        declare continue handler for not found set Done2 =1; 
        /*打开游标*/
        open Cursor_PaymentDomestics_AftereUpdate;
        /*循环开始*/
        flag_loop_PaymentDomesticsDetail:loop
        /*给游标变量赋值*/
        fetch Cursor_PaymentDomestics_AftereUpdate into sKeyNo,sInvoiceNO; 
        /*判断游标的循环是否结束*/
        if Done2 then 
        leave flag_loop_PaymentDomesticsDetail ; 
        end if ;
        call Proc_ReceiveSamples_SumReceiveChargeed2(srid,sKeyNo);-- 收样管理-已付快件费
        call Proc_SendSamples_SumExpressFeesed2(sInvoiceNO);-- 寄样管理-已付快件费
        set sSettlementsRid=(Select rid From Settlements Where InvoiceNO=sInvoiceNO Limit 0,1);
        call Proc_Settlements_SumMiscellaneousPaidUp2(sInvoiceNO);-- 结算费用-已付运杂费
        call Proc_Settlements_SumExpressFees2(sInvoiceNO);-- 结算费用-已付快件费
        call Proc_Settlements_SumOtherDomesticsPaidUp2(sInvoiceNO);-- 结算中心-国内其他费用
        call Proc_Settlements_MathGrossProfit2(sSettlementsRid);-- 结算中心-实际业务毛利
        end loop;  /*循环结束*/
        close Cursor_PaymentDomestics_AftereUpdate;/*关闭游标*/
        end;
    end if;
end$
delimiter ;