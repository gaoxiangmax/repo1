/*
审批状态
*/
delimiter $
drop trigger if exists Tgr_sys_workflow_instance_AferUpdate $
create trigger Tgr_sys_workflow_instance_AferUpdate after update
on sys_workflow_instance 
for each row
begin
    declare iDeleted int;
    declare iState int;
    declare srid varchar(36);
    declare sModule varchar(100);

    set iDeleted=new.deleted;
    set iState=new.state;
    set srid=new.record_id;
    set sModule=new.module;
    if iDeleted=0 and iState=1 then
        if sModule='客户报价' then
            Update Quotations Set QuotationStatus='已报价' Where rid=srid;
        elseif sModule='销售合同' then
            Update SalesOrders Set SalesOrderStatus='已审批' Where rid=srid;
        elseif sModule='采购合同' then
            Update PurchaseOrders Set PurchaseOrderStatus='已审批' Where rid=srid;
        end if;
    elseif iDeleted=1 then
        if sModule='客户报价' then
            Update Quotations Set QuotationStatus='处理中' Where rid=srid;
        elseif sModule='销售合同' then
            Update SalesOrders Set SalesOrderStatus='待确认' Where rid=srid;
        elseif sModule='采购合同' then
            Update PurchaseOrders Set PurchaseOrderStatus='待确认' Where rid=srid;
        end if;
    elseif iDeleted=0 and iState=0 then
        if sModule='客户报价' then
            Update Quotations Set QuotationStatus='处理中' Where rid=srid;
        elseif sModule='销售合同' then
            Update SalesOrders Set SalesOrderStatus='已生效' Where rid=srid;
        elseif sModule='采购合同' then
            Update PurchaseOrders Set PurchaseOrderStatus='已生效' Where rid=srid;
        end if;
    end if;
end$
delimiter ;