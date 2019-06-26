/*
客户资料-最近寄样
*/
delimiter $
drop trigger if exists Tgr_SendSamples_AftereUpdate $
create trigger Tgr_SendSamples_AftereUpdate after update
on SendSamples 
for each row
begin
    /*定义变量*/
    declare srid varchar(255);
    declare sNewCustomerNo varchar(255);
    declare sOldCustomerNo varchar(255); 
    declare dNewDate date;
    declare dOldDate date;
    set srid=new.rid;
    set sNewCustomerNo=new.PartnerNo;
    set sOldCustomerNo=old.PartnerNo;
    set dNewDate=new.SendDate;
    set dOldDate=old.SendDate;
    if ifNull(dNewDate,'') <> ifNull(dOldDate,'') or ifNull(sNewCustomerNo,'')<>ifNull(sOldCustomerNo,'') then
        call Proc_Customers_LastSend(sNewCustomerNo);-- 客户资料-最近寄样 

        call Proc_Customers_LastSend(sOldCustomerNo);-- 客户资料-最近寄样 
    end if;

    if ifNull(dNewDate,'') <> ifNull(dOldDate,'') then
        begin
            /*定义变量*/
            declare sItemNo varchar(255);
            /*定义结束标志变量*/
            declare Done int default 0;
            /*定义游标 以及赋值*/
            declare Cursor_SendSamples_AftereUpdate_SendSamplesLine cursor for 
            Select ItemNo From SendSamplesLine Where pid=srid;
            /*指定游标循环结束时的返回值 */
            declare continue handler for not found set Done =1; 
            /*打开游标*/
            open Cursor_SendSamples_AftereUpdate_SendSamplesLine;
            /*循环开始*/
            flag_loop_SendSamplesLine:loop
            /*给游标变量赋值*/
            fetch Cursor_SendSamples_AftereUpdate_SendSamplesLine into sItemNo; 
            /*判断游标的循环是否结束*/
            if Done then 
                leave flag_loop_SendSamplesLine ; 
            end if ;
            call Proc_Items_LastSend2(sItemNo);-- 产品资料-最近寄样
            end loop;  /*循环结束*/
            close Cursor_SendSamples_AftereUpdate_SendSamplesLine;/*关闭游标*/
        end;
    end if;
end$
/*恢复结束符为;*/
delimiter ;