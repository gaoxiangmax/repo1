/*
销售合同-备货进度、交货进度
--备货进度=同一“销售合同号”下的采购合同的合同状态为"已完成"或"已交货"或"已付款"或"已发完"的采购合同数/当前销售合同号下的采购合同总数;
--交货进度=同一“销售合同号”下的采购合同的合同状态为"已交货"或"已付款"或"已发完"的采购合同数/当前销售合同号下的采购合同总数;
--
-- if 采购合同的合同状态=“生产中”或“待确认”，则所属的销售合同合同状态=“生产中”;
-- if 采购合同的合同状态=“已完成”，当“备货进度”>=100，则所属的销售合同合同状态=“已完成”，否则“生产中”；
-- if 采购合同的合同状态=“已交货”或“已付款”或“已发完成”，
--  当“备货进度”>=100且交货进度>=100，则所属的销售合同合同状态=“已交货”，
--  当“备货进度”>=100且交货进度<100，则所属的销售合同合同状态=“已完成”，
--  否则“生产中”。
--
-- 销售合同审批通过 销售合同状态-已生效
-- 销售合同取消审批  销售合同状态-待确认
-- 采购合同审批通过  采购合同状态-生产中
-- 采购合同取消审批  采购合同状态-待确认
*/
delimiter $ 
drop procedure if exists Proc_PurchaseOrders_StockProgress_DeliverySchedule $
create procedure Proc_PurchaseOrders_StockProgress_DeliverySchedule(sSalesOrderNo varchar(255),sPurchaseOrderStatus varchar(255)) 
begin
    declare iPurchaseOrderQty int;
    declare iPurchaseOrderedQty int;
    declare fStockProgress decimal(18,2);
    declare fDeliverySchedule decimal(18,2);         
    -- 备货进度计算
    set iPurchaseOrderedQty = (Select 
                                Count(rid) As yj
                            From 
                                PurchaseOrders
                            Where SalesOrderNo = sSalesOrderNo
                                    And ((PurchaseOrderStatus = '已完成')
                                        Or (PurchaseOrderStatus = '已交货')
                                        Or (PurchaseOrderStatus = '已付款')
                                        Or (PurchaseOrderStatus = '已发完')));
        
    set iPurchaseOrderQty = (Select 
                            Count(rid) As yj
                            From   
                            PurchaseOrders
                            Where  
                            SalesOrderNo = sSalesOrderNo);

    set fStockProgress = (Select 
                            Case When 
                            iPurchaseOrderQty = 0 Then 0
                            else 100 * iPurchaseOrderedQty / iPurchaseOrderQty
                            end);

    -- 交货进度计算
    set iPurchaseOrderedQty = ( Select 
                                Count(rid) As yj
                                From  
                                PurchaseOrders
                                Where  
                                SalesOrderNo = sSalesOrderNo
                                And ((PurchaseOrderStatus = '已交货')
                                        Or (PurchaseOrderStatus = '已付款')
                                        Or (PurchaseOrderStatus = '已发完')));

    set fDeliverySchedule = (Case When 
                            iPurchaseOrderQty = 0 Then 0
                            else 100 * iPurchaseOrderedQty / iPurchaseOrderQty
                            end);

    if (sPurchaseOrderStatus = '生产中') Or (sPurchaseOrderStatus = '待确认') then
    Update 
        SalesOrders
    set    
        DeliverySchedule = fDeliverySchedule,
        StockProgress = fStockProgress,
        SalesOrderStatus = '生产中'
    Where  SalesOrderNo = sSalesOrderNo;
    elseif sPurchaseOrderStatus = '已完成' then
    Update 
        SalesOrders
    set    
        DeliverySchedule = fDeliverySchedule,
        StockProgress = fStockProgress,
        SalesOrderStatus = (Select Case 
                            When fStockProgress >= 100 Then '已完成'
                            else '生产中'
                            end)
    Where  SalesOrderNo = sSalesOrderNo;
    elseif (sPurchaseOrderStatus = '已交货') Or (sPurchaseOrderStatus = '已付款') Or (sPurchaseOrderStatus = '已发完') then
    Update 
        SalesOrders
    set    
        DeliverySchedule = fDeliverySchedule,
        StockProgress = fStockProgress,
        SalesOrderStatus = (Case 
                            When fStockProgress >= 100
                                And fDeliverySchedule >= 100 Then '已交货'
                            When fStockProgress >= 100
                                And fDeliverySchedule < 100 Then '已完成'
                            else '生产中'
                            end)
    Where  SalesOrderNo = sSalesOrderNo;
    end if;
end $ 
delimiter ;