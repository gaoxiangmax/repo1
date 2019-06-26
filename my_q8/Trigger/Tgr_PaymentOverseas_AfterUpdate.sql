/*
国外费用-详细用途
*/
delimiter $
drop trigger if exists Tgr_PaymentOverseas_AftereUpdate $
create trigger Tgr_PaymentOverseas_AftereUpdate after update
on PaymentOverseas 
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
        call Proc_ApplyForPayments_PaymentOverseas_UnPaiedAmount(sNewID);-- 付款申请-国外费用
        call Proc_ApplyForPayments_PaymentOverseas_UnPaiedAmount(sOldID);-- 付款申请-国外费用
    end if;

    if ifNull(sNewCostName,'')<>ifNull(sOldCostName,'') then
        begin
            /*定义变量*/
            declare sInvoiceNO varchar(255);
            declare SettlementsRid varchar(255);
            /*定义结束标志变量*/
            declare Done2 int default 0;
            /*定义游标 以及赋值*/
            declare Cursor_PaymentOverseas_AftereUpdate_PaymentOverseasDetail cursor for 
            Select InvoiceNO From PaymentOverseasDetail Where pid=srid;
            /*指定游标循环结束时的返回值 */
            declare continue handler for not found set Done2 =1; 
            /*打开游标*/
            open Cursor_PaymentOverseas_AftereUpdate_PaymentOverseasDetail;
            /*循环开始*/
            flag_loop_PaymentOverseasDetail:loop
            /*给游标变量赋值*/
            fetch Cursor_PaymentOverseas_AftereUpdate_PaymentOverseasDetail into sInvoiceNO; 
            /*判断游标的循环是否结束*/
            if Done2 then 
            leave flag_loop_PaymentOverseasDetail ; 
            end if ;
            set SettlementsRid=(Select rid From Settlements Where InvoiceNO=sNewInvoiceNO Limit 0,1);
            call Proc_Settlements_SumCommissionPaidUp2(sInvoiceNO);-- 结算中心-已付佣金
            call Proc_Settlements_SumInsurancePaidUp2(sInvoiceNO);-- 结算中心-已付保险
            call Proc_Settlements_SumSeaFreightPaidUp2(sInvoiceNO);-- 结算中心-已付海运
            call Proc_Settlements_SumOtherOverseasPaidUp2(sInvoiceNO);-- 结算中心-其它国外费用
            call Proc_Settlements_MathGrossProfit2(srid);-- 结算中心-实际业务毛利
            end loop;  /*循环结束*/
            close Cursor_PaymentOverseas_AftereUpdate_PaymentOverseasDetail;/*关闭游标*/
        end;
    end if;
end$
delimiter ;