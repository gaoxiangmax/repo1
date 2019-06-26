/*
寄样管理-已收样品费
*/
delimiter $ 
drop procedure if exists Proc_SendSamples_SumInSampleFees $
create procedure Proc_SendSamples_SumInSampleFees(srid varchar(255),sKeyNo varchar(255)) 
begin
    declare sCustomerNo varchar(255);
    declare fInSampleFees decimal(18,2);
    set sCustomerNo=(Select CustomerNo From Incomes Where rid=srid Limit 0,1);
    set fInSampleFees=(Select Sum(ifnull(IncomesDetail.UsedAmount,0)) as UsedAmount From Incomes,IncomesDetail Where
        Incomes.rid=IncomesDetail.pid and Incomes.CustomerNo=sCustomerNo and IncomesDetail.CostName='样品费' and IncomesDetail.KeyID=sKeyNo);
    Update SendSamples set InSampleFees =ifnull(fInSampleFees,0),UnInSampleFees=(ifnull(SampleFees,0)-ifnull(fInSampleFees,0))  Where 
        SendSamples.PartnerNo =sCustomerNo and SendSamples.TNTNo=sKeyNo;
end $ 
delimiter ;