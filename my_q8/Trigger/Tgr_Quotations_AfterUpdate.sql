/*
客户报价
*/
delimiter $
drop trigger if exists Tgr_Quotations_AftereUpdate $
create trigger Tgr_Quotations_AftereUpdate after update
on Quotations 
for each row
begin
    /*定义变量*/
    declare srid varchar(255); 
    declare sNewCustomerNo varchar(255); 
    declare sOldCustomerNo varchar(255); 
    declare dNewDate date;
    declare dOldDate date;
    set srid=new.rid;
    set sNewCustomerNo=new.CustomerNo;
    set sOldCustomerNo=old.CustomerNo;
    set dNewDate=new.QuotationDate;
    set dOldDate=old.QuotationDate;
    /*insert和update触发器合并*/
        if ifNull(dNewDate,'') <> ifNull(dOldDate,'') or ifNull(sNewCustomerNo,'')<>ifNull(sOldCustomerNo,'') then
        call Proc_Customers_LastQuotation(sNewCustomerNo);-- 客户资料-最近报价 
        end if;

        if ifNull(sNewCustomerNo,'')<>ifNull(sOldCustomerNo,'') then
        call Proc_Customers_LastQuotation(sOldCustomerNo);-- 客户资料-最近报价 
        end if;

        if ifNull(dNewDate,'') <> ifNull(dOldDate,'') then
            begin
                /*定义变量*/
                declare sItemNo varchar(255);
                /*定义结束标志变量*/
                declare Done int default 0;
                /*定义游标 以及赋值*/
                declare Cursor_Quotations_AftereUpdate_QuotationsLine cursor for 
                Select ItemNo From QuotationsLine Where pid=srid;
                /*指定游标循环结束时的返回值 */
                declare continue handler for not found set Done =1; 
                /*打开游标*/
                open Cursor_Quotations_AftereUpdate_QuotationsLine;
                /*循环开始*/
                flag_loop_QuotationsLine:loop
                /*给游标变量赋值*/
                fetch Cursor_Quotations_AftereUpdate_QuotationsLine into sItemNo; 
                /*判断游标的循环是否结束*/
                if Done then 
                leave flag_loop_QuotationsLine ; 
                end if ;
                call Proc_Items_LastQuotation2(sItemNo);-- 产品资料-最近报价
                end loop;  /*循环结束*/
                close Cursor_Quotations_AftereUpdate_QuotationsLine;/*关闭游标*/
            end;
        end if;
end$
/*恢复结束符为;*/
delimiter ;