/*
Q系配置-某些需要通过数据填充、决策分析等必须使用SQL语句获取配置信息的公共字段，放入内存表SystemEnable_Public中
*/
delimiter $ 
drop procedure if exists Proc_SystemEnable_Public $
create procedure Proc_SystemEnable_Public(bPurchaseOrders_NoNeedForApprovalDepositCheck boolean,bSystemConfig_MultistageMenu boolean,bShipingPlans_AllowSalesWorkflow boolean) 
begin
    if (Select Count(*) as yj From SystemEnable_Public)>0 then
        Update SystemEnable_Public Set PurchaseOrders_NoNeedForApprovalDepositCheck=bPurchaseOrders_NoNeedForApprovalDepositCheck,SystemConfig_MultistageMenu=bSystemConfig_MultistageMenu,ShipingPlans_AllowSalesWorkflow=bShipingPlans_AllowSalesWorkflow;
    else
        Insert into SystemEnable_Public(PurchaseOrders_NoNeedForApprovalDepositCheck,SystemConfig_MultistageMenu,ShipingPlans_AllowSalesWorkflow) 
            values(bPurchaseOrders_NoNeedForApprovalDepositCheck,bSystemConfig_MultistageMenu,bShipingPlans_AllowSalesWorkflow);
    end if;
end $ 
delimiter ;