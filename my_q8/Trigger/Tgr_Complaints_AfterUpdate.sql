/*
客诉管理
*/
delimiter $
drop trigger if exists Tgr_Complaints_AftereUpdate $
create trigger Tgr_Complaints_AftereUpdate after update
on Complaints 
for each row
begin
    /*定义变量*/
    declare sInvoiceNO varchar(255); 
    declare sOldInvoiceNO varchar(255);
    set sInvoiceNO=new.InvoiceNO;
    set sOldInvoiceNO=old.InvoiceNO;
    if sInvoiceNO<>sOldInvoiceNO then
        call Proc_Settlements_SumClaimAmount(sInvoiceNO);-- 结算中心-索赔金额
        begin
            /*定义变量*/
            declare sKeyNo varchar(255);
            declare srid varchar(255);   
            /*定义结束标志变量*/
            declare Done2 int default 0;
            /*定义游标 以及赋值*/
            declare Cursor_Complaints_AftereUpdate_ComplaintsBlames cursor for 
            Select PurchaseOrderNo From ComplaintsBlames Where pid=srid;
            /*指定游标循环结束时的返回值 */
            declare continue handler for not found set Done2 =1; 
            /*打开游标*/
            open Cursor_Complaints_AftereUpdate_ComplaintsBlames;
            /*循环开始*/
            flag_loop_ComplaintsBlames:loop
            /*给游标变量赋值*/
            fetch Cursor_Complaints_AftereUpdate_ComplaintsBlames into sKeyNo; 
            /*判断游标的循环是否结束*/
            if Done2 then 
                leave flag_loop_ComplaintsBlames ; 
            end if ;
                call Proc_Settlements_SumSupplierClaimAmount2(sInvoiceNO,sKeyNo);-- 结算中心-工厂付款-索赔金额
                set srid=(Select rid From Settlements Where InvoiceNO=sInvoiceNO Limit 0,1);
                call Proc_SettlementsDetail_MathGrossProfit2(srid);-- 结算中心-实际业务毛利

                call Proc_Settlements_SumSupplierClaimAmount2(sOldInvoiceNO,sKeyNo);-- 结算中心-工厂付款-索赔金额
                set srid=(Select rid From Settlements Where InvoiceNO=sOldInvoiceNO Limit 0,1);
                call Proc_SettlementsDetail_MathGrossProfit2(srid);-- 结算中心-实际业务毛利
                
            end loop;  /*循环结束*/
            close Cursor_Complaints_AftereUpdate_ComplaintsBlames;/*关闭游标*/
        end;
    end if;
end $
delimiter ;