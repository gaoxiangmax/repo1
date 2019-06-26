/*
产品资料-最近报价
*/

delimiter $ 
drop procedure if exists Proc_Items_LastQuotation2 $
create procedure Proc_Items_LastQuotation2(sItemNo varchar(255)) 
begin
    Update Items set LastQuotation = (Select Quotations.QuotationDate From Quotations,QuotationsLine Where Quotations.rid=QuotationsLine.pid and
        QuotationsLine.ItemNo=sItemNo Order By Quotations.sid Desc Limit 0,1) Where ItemNo=sItemNo;
end $ 
delimiter ;