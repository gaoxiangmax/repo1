/*
产品资料-最近寄样
*/
delimiter $ 
drop procedure if exists Proc_Items_LastSend $
create procedure Proc_Items_LastSend(sItemNo varchar(255)) 
begin
    Update Items set LastSend = (Select SendSamples.SendDate From SendSamples,SendSamplesLine Where SendSamples.rid=SendSamplesLine.pid and
        SendSamplesLine.ItemNo=sItemNo Order By SendSamples.sid Desc Limit 0,1) Where ItemNo=sItemNo;
end $ 
delimiter ;