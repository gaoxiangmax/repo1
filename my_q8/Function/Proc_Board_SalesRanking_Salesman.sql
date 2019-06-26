/*
看板-销售排名-业务员
*/
delimiter $ 
drop procedure if exists Proc_Board_SalesRanking_Salesman $
create procedure Proc_Board_SalesRanking_Salesman()
begin
    declare sItemName text;         -- 保存销售员姓名html信息
    declare sItemValue text;        -- 保存销售员业绩html信息
    declare sUp varchar(4000);      -- 增长html标记
    declare sDown varchar(4000);    -- 减少html标记
    declare sLevel varchar(4000);   -- 

    /*建内存表*/
    create table if not exists Board_SalesRanking_Salesman (
        ItemName        text,
        ItemValue       text); 
    truncate TABLE Board_SalesRanking_Salesman;  -- 使用前先清空内存表。

    set sUp = '<i style="color:#db2828;font-size:14px;" class="long arrow up icon" title=';
    set sDown = '<i style="color:#21ba45;font-size:14px;" class="long arrow down icon" title=';
    set sLevel = '<i style="color:#767676;font-size:14px;" class="calendar minus icon"></i>';
    
    -- <循环创建虚拟表记录begin>
    begin
        declare sSalesman varchar(255);             -- 销售员名字
        declare fTotalAmount decimal(18,2);         -- 今年业绩总额
        declare fLastTotalAmount decimal(18,2);     -- 去年业绩总额
        declare fGlowRate decimal(18,2);            -- 业绩增长率
        declare iRowNo int;                         -- 今年排名
        declare iLastRowNo int default 0;           -- 去年排名
        declare iGlowNo int default 0;              -- 排名增长率

        /*定义结束标志变量*/
        declare Done int default 0;
        /*定义游标 以及赋值*/
        declare Cursor_Board_SalesRanking_Salesman cursor for 
            -- 一张表,字段 rowNo Salesman TotalAmount, 今年的PI中销售员排行,按TotalAmount从大到小排
            SELECT
                -- @rowNum:=@rowNum+1(名次从1开始)保留整数,别名rowNo
                ifNull(Format((@rowNum := @rowNum + 1), 0),0) AS rowNo, SalesOrders.Salesman, SalesOrders.TotalAmount
                FROM
                (
                    (SELECT
                    IFNULL(Salesman, '') AS Salesman, IFNULL(SUM(ConvertUSD), 0) AS TotalAmount
                    FROM
                    SalesOrders
                    -- 条件1：orderdate在今年第一天00:00:00到今天23:59:59之间的数据
                    WHERE OrderDate BETWEEN concat(DATE_SUB(
                        -- 今年第1天 00:00:00
                        CURDATE(), INTERVAL DAYOFYEAR(CURDATE()) - 1 DAY
                    ),' 00:00:00')
                    -- 今天 00:00:00
                    AND concat(CURDATE(),' 23:59:59')
                    -- 条件2： status不是'待确认'或者'已作废'
                    AND SalesOrderStatus NOT IN ('待确认', '已作废')
                    GROUP BY Salesman
                    ORDER BY TotalAmount DESC
                    LIMIT 0, 10) SalesOrders,
                    -- 给@rowNum赋值为0
                    (SELECT
                    (@rowNum := 0)) tROWS
                );
        /*指定游标循环结束时的返回值 */
        declare continue handler for not found set Done =1; 
        /*打开游标*/
        open Cursor_Board_SalesRanking_Salesman;
        /*循环开始*/
        flag_loop_SalesRanking_Salesman:loop
        /*给游标变量赋值*/
        fetch Cursor_Board_SalesRanking_Salesman into iRowNo,sSalesman,fTotalAmount; 
        /*判断游标的循环是否结束*/
        if Done then 
            leave flag_loop_SalesRanking_Salesman ; 
        end if ;
        set fLastTotalAmount = 0;
        set fGlowRate = 0;
        set iLastRowNo = 0;

        if (iRowNo=1) then
        set sItemName = (Select concat('<a class="ui orange circular label">', iRowNo , '</a>' , '&nbsp;' , sSalesman)); 
        elseif (iRowNo=2) then
            set sItemName = (Select concat('<a class="ui yellow circular label">', iRowNo , '</a>' , '&nbsp;' , sSalesman));
        elseif (iRowNo=3) then
            set sItemName = (Select concat('<a class="ui olive circular label">', iRowNo , '</a>' , '&nbsp;' , sSalesman));
        else
            set sItemName = (Select concat('<a class="ui circular label">', iRowNo , '</a>' , '&nbsp;' , sSalesman));
        end if;


        -- 去年同期销售额,查询去年年初到去年今天该业务员的TotalAmount,赋值给fLastTotalAmount
        set fLastTotalAmount=(Select
                                ifNull(SUM(ConvertUSD), 0) as TotalAmount
                                From
                                SalesOrders
                                Where OrderDate between concat(DATE_SUB(
                                    DATE_SUB(
                                    CURDATE(), INTERVAL dayofyear(CURDATE()) - 1 DAY
                                    ), INTERVAL 1 YEAR
                                ),' 00:00:00')
                                and concat(DATE_SUB(curdate(), INTERVAL 1 YEAR),' 23:59:59')
                                and SalesOrderStatus not in ('待确认', '已作废')
                                and Salesman = sSalesman);

        -- 如果今年大于去年
        if (fTotalAmount - fLastTotalAmount > 0 and fLastTotalAmount > 0) then
            -- 算出增长比
            set fGlowRate = (Select round((fTotalAmount-fLastTotalAmount)/fLastTotalAmount,2));
            -- 拼出 $+总额+上箭头+'销售额同比增长'+增长比
            set sItemValue = (Select concat('$' , fTotalAmount , sUp , '销售额同比增长',fGlowRate,'%></i>'));

        -- 如果今年小于去年
        elseif (fTotalAmount - fLastTotalAmount < 0 and fLastTotalAmount > 0) then
            -- 算出增长比
            set fGlowRate = (Select round((fTotalAmount-fLastTotalAmount)/fLastTotalAmount,2));
            -- 拼出 $+总额+下箭头+'销售额同比下降'+增长比
            set sItemValue = (Select concat('$' , fTotalAmount , sDown , '销售额同比下降',fGlowRate,'%></i>'));  
        
        -- 其他
        else
            -- 拼出 $+总额+
            set sItemValue = (Select concat('$' , fTotalAmount , sLevel));
        end if;



        -- 去年同期排名
        set iLastRowNo = (
                        SELECT
                            ifNull(rowNo,0) as rowNo
                            From
                            (SELECT
                                Format((@rowNum := @rowNum + 1), 0) AS rowNo, SalesOrders.Salesman, SalesOrders.TotalAmount
                            FROM
                                (
                                (SELECT
                                    IFNULL(Salesman, '') AS Salesman, IFNULL(SUM(ConvertUSD), 0) AS TotalAmount
                                FROM
                                    SalesOrders
                                -- 条件1：orderdate在去年第一天00:00:00到去年的今天23:59:59之间的数据
                                WHERE OrderDate BETWEEN concat(DATE_SUB(
                                    DATE_SUB(
                                        -- 当前日期 - (今天是今年的第几天-1天)的时间间隔 = 今年第一天的日期
                                        CURDATE(), INTERVAL DAYOFYEAR(CURDATE()) - 1 DAY
                                        -- 今年第一条的日期 - 1年的时间间隔 = 去年第一天的日期
                                    ), INTERVAL 1 YEAR
                                    -- 去年第一天的日期后面拼接 00:00:00
                                    ),' 00:00:00')
                                    -- 去年今天的日期后面拼接 23:59:59
                                    AND concat(DATE_SUB(CURDATE(), INTERVAL 1 YEAR),' 23:59:59')
                                    -- 条件2： status不是'待确认'或者'已作废'
                                    AND SalesOrderStatus NOT IN ('待确认', '已作废')
                                GROUP BY Salesman
                                ORDER BY TotalAmount DESC
                                LIMIT 0, 10) SalesOrders,
                                (SELECT
                                    (@rowNum := 0)) tROWS
                                )) TLastSalesOrder
                            Where TLastSalesOrder.Salesman = sSalesman);
        if (iRowNo - iLastRowNo > 0 and iLastRowNo > 0) then
            set iGlowNo = (iRowNo - iLastRowNo);
            set sItemValue = (Select concat(sItemValue, sDown , '销售排名同比下降', iGlowNo ,'名></i>')); 
        elseif (iRowNo - iLastRowNo < 0 and iLastRowNo > 0) then
            set iGlowNo = (iLastRowNo - iRowNo);
            set sItemValue = (Select concat(sItemValue, sUp , '销售排名同比上升', iGlowNo ,'名></i>')); 
        else
            set sItemValue = (Select concat(sItemValue , sLevel));
        end if;
        insert into Board_SalesRanking_Salesman(ItemName,ItemValue) values (sItemName,sItemValue);
        end loop;  /*循环结束*/
        close Cursor_Board_SalesRanking_Salesman;/*关闭游标*/
    end;
    -- <循环创建虚拟表记录end>  
end $ 
delimiter ;