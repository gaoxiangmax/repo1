/*
客户收汇-详细用途
*/
delimiter $
drop trigger if exists Tgr_Incomes_AftereUpdate $
create trigger Tgr_Incomes_AftereUpdate after update
on Incomes 
for each row
begin
    /*定义变量*/
    declare srid varchar(255);
    declare sNewCustomerNo varchar(255); 
    declare sOldCustomerNo varchar(255); 
    set srid=new.rid;
    set sNewCustomerNo=new.CustomerNo;
    set sOldCustomerNo=old.CustomerNo;
    call Proc_Incomes_TotalCollection(sNewCustomerNo);
    call Proc_Incomes_TotalCollection(sOldCustomerNo);
    if ifNull(sNewCustomerNo,'')<>ifNull(sOldCustomerNo,'') then
        begin
            /*定义变量*/
            declare sKeyNo varchar(255); 
            /*定义结束标志变量*/
            declare Done2 int default 0;
            /*定义游标 以及赋值*/
            declare Cursor_Incomes_AftereUpdate_IncomesDetail cursor for 
            Select KeyID From IncomesDetail Where pid=srid;
            /*指定游标循环结束时的返回值 */
            declare continue handler for not found set Done2 =1; 
            /*打开游标*/
            open Cursor_Incomes_AftereUpdate_IncomesDetail;
            /*循环开始*/
            flag_loop_IncomesDetail:loop
            /*给游标变量赋值*/
            fetch Cursor_Incomes_AftereUpdate_IncomesDetail into sKeyNo; 
            /*判断游标的循环是否结束*/
            if Done2 then 
                leave flag_loop_IncomesDetail ; 
            end if ;
                call Proc_SendSamples_SumInSampleFees2(srid,sKeyNo);-- 寄样管理-已收样品费
            end loop;  /*循环结束*/
            close Cursor_Incomes_AftereUpdate_IncomesDetail;/*关闭游标*/
        end;
    end if;
end$
delimiter ;