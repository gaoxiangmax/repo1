/*
通过发票号码分拆其下的采购合同，用在工厂付款中
*/
delimiter $ 
drop procedure if exists Proc_BillNotifies_Statistics $
create procedure Proc_BillNotifies_Statistics(sApplyNo varchar(30)) 
begin
    declare sKeyNo varchar(255);
    declare dKeyDate date;
    declare iSerialID int DEFAULT 0;
    /*定义结束标志变量*/
    declare Done int default 0;
    /*建内存表，内存表和临时表区别在于生命周期*/
    create table if not exists Tempyj (
        sid             int,
        yj              decimal(18,2),
        InvoiceNO       varchar(255),
        KeyModaul       varchar(255),
        KeyDate         varchar(255),
        PurchaseOrderNo varchar(255),
        DocumentStaff   varchar(255)) ENGINE=MEMORY DEFAULT CHARSET=utf8; 
    truncate TABLE Tempyj;  -- 使用前先清空内存表。  
    begin
        /*定义游标 以及赋值*/
        declare Cursor_Proc_BillNotifies_Statistics cursor for 
        Select ApplyForPaymentsDetail.KeyNo,
                ApplyForPaymentsDetail.KeyDate
        From   ApplyForPaymentsDetail,
                ApplyForPayments
        Where  ApplyForPayments.rid = ApplyForPaymentsDetail.pid
            And ApplyForPayments.ApplyNo = sApplyNo
            And ApplyForPayments.CanBill = '是';
        /*指定游标循环结束时的返回值 */
        declare continue handler for not found set Done =1; 
        /*打开游标*/
        open Cursor_Proc_BillNotifies_Statistics;
        /*循环开始*/
        flag_loop:loop
        /*给游标变量赋值*/
        fetch Cursor_Proc_BillNotifies_Statistics into sKeyNo,dKeyDate; 
        /*判断游标的循环是否结束*/
        if Done then 
            leave flag_loop ; 
        end if ;
            Set iSerialID = (iSerialID+1);
            Insert Into Tempyj
                            (sid,
                                yj,
                                PurchaseOrderNo,
                                KeyDate,
                                InvoiceNO,
                                KeyModaul,
                                DocumentStaff)
                    Select   iSerialID as sid,
                            (Sum(BillNotifiesLine.BillAmount) - (Select ifnull(Sum(ApplyForPaymentsDetail.ApplyAmount),0) As yj
                                                                From   ApplyForPaymentsDetail,
                                                                        ApplyForPayments
                                                                Where  ApplyForPayments.rid = ApplyForPaymentsDetail.pid
                                                                        And ApplyForPayments.PaymentType = '工厂付款'
                                                                        And ApplyForPayments.CostName = '定金'
                                                                        And KeyNo = BillNotifiesLine.PurchaseOrderNo)) As yj,
                            -- 开票通知子表某合同开票总额-付款申请已付定金=还未付的货款
                            BillNotifiesLine.PurchaseOrderNo,
                            dKeyDate as KeyDate,
                            BillNotifies.InvoiceNO,
                            '采购合同'                                                                                     As KeyModaul,
                            BillNotifies.DocumentStaff
                    From     BillNotifies,
                            BillNotifiesLine
                    Where    BillNotifies.rid = BillNotifiesLine.pid
                            And BillNotifies.BillNotifyNo = sKeyNo
                    Group By BillNotifiesLine.PurchaseOrderNo,
                            BillNotifies.InvoiceNO,
                            BillNotifies.DocumentStaff;
        end loop;  /*循环结束*/
        close Cursor_Proc_BillNotifies_Statistics;/*关闭游标*/
    end;
end $ 
delimiter ;