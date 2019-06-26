-- 适用于Proc_Board_SalesRanking_Salesman,参数:Salesman,TotalAmount
-- Proc_Board_SalesRanking_Product,参数:ENGItemName(ItemNo) as sName,TotalAmount,OrderQty
-- Proc_Board_SalesRanking_Customers,参数:CustomerShortName,TotalAmount
declare sItemName text;         -- 保存销售员姓名html信息
declare sItemValue text;        -- 保存销售员业绩html信息
declare sUp varchar(4000);      -- 增长html标记
declare sDown varchar(4000);    -- 减少html标记
declare sLevel varchar(4000);


create table if not exists Board_SalesRanking_Salesman (
    ItemName        text,
    ItemValue       text); 


begin
    local variable:
    declare sSalesman varchar(255);
    declare fTotalAmount decimal(18,2);                 -- 今年业绩总额
    declare fLastTotalAmount decimal(18,2);             -- 去年该业务员同期业绩
    declare fGlowRate decimal(18,2);                    -- 业绩增长率
    declare iRowNo int;                                 -- 今年排名
    declare iLastRowNo int default 0;                   -- 去年该业务员的同期排名
    declare iGlowNo int default 0;                      -- 排名增长率

    declare Cursor_Board_SalesRanking_Salesman cursor for 今年销售员排行
    loop start
        if 循环结束 then leave loop

        set iRowNo=销售排名,sSalesman=销售员名字,fTotalAmount销售量; 
            if iRowNo=第1 then 拼接第一名sItemName
            if iRowNo=第2 then 拼接第二名sItemName
            if iRowNo=第3 then 拼接第三名sItemName
            else 拼接其他sItemName

        清空之前循环数据set fLastTotalAmount = 0;
        清空之前循环数据set fGlowRate = 0;
        清空之前循环数据set iLastRowNo = 0;

        set fLastTotalAmount=去年该业务员同期业绩
            if 今年大于去年 then 
                算出业绩增长fGlowRate
                拼接业绩增长sItemValue
            elseif 今年小于去年 then 
                算出业绩下降fGlowRate
                拼接业绩下降sItemValue
            else
                拼接其他业绩情况sItemValue

        set iLastRowNo=去年该业务员的同期排名
            if 排名上升 then
                算出排名增长fGlowNo
                继业绩后继续拼接排名增长sItemValue
            elseif 排名下降 then
                算出排名下降fGlowNo
                继业绩后继续拼接排名下降sItemValue
            else
                拼接其他排名情况sItemValue
        
        insert into Board_SalesRanking_Salesman(ItemName,ItemValue) values (sItemName,sItemValue);
    end loop

end;