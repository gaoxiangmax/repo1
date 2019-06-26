/*
开票通知-已开票金额、未开票金额
*/
delimiter $ 
drop procedure if exists Proc_BillNotifies_SumBilledAmount $
create procedure Proc_BillNotifies_SumBilledAmount(sBillNotifyNo varchar(255)) 
begin
    declare fBilledAmount decimal(18,2);
    set fBilledAmount=(Select sum(ifnull(TotalBilledAmount,0)) as TotalBilledAmount from SupplyInvoices Where BillNotifyNo=sBillNotifyNo);

    Update BillNotifies set BilledAmount = fBilledAmount,TotalUnBilledAmount1=ifnull(TotalBillAmount,0)-fBilledAmount Where 
        BillNotifyNo =sBillNotifyNo;
end $ 
delimiter ;