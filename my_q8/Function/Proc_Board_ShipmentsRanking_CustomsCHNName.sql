/*
看板-出货排名.报关品名
*/
delimiter $ 
drop procedure if exists Proc_Board_ShipmentsRanking_CustomsCHNName $
create procedure Proc_Board_ShipmentsRanking_CustomsCHNName()
begin
    declare sItemName text;
    declare sItemValue text;
    declare sUp varchar(4000);
    declare sDown varchar(4000);
    declare sLevel varchar(4000);
    /*建内存表*/
    create table if not exists Board_ShipmentsRanking_CustomsCHNName (
          ItemName        text,
          ItemValue       text); 
    truncate TABLE Board_ShipmentsRanking_CustomsCHNName;  -- 使用前先清空内存表。

    set sUp = '<i style="color:#db2828;font-size:14px;" class="long arrow up icon" title=';
    set sDown = '<i style="color:#21ba45;font-size:14px;" class="long arrow down icon" title=';
    set sLevel = '<i style="color:#767676;font-size:14px;" class="calendar minus icon"></i>';
	
    -- <循环创建虚拟表记录begin>
    begin
        declare sHSCode varchar(255);
        declare sName varchar(255);
        declare fTotalAmount decimal(18,2);
        declare fShippingQty decimal(18,2);
        declare fLastTotalAmount decimal(18,2);
        declare fGlowRate decimal(18,2);   
        declare iRowNo int; -- 当期排名
        declare iLastRowNo int default 0; -- 去年同期排名
        declare iGlowNo int default 0;
        /*定义结束标志变量*/
        declare Done int default 0;
        /*定义游标 以及赋值*/
        declare Cursor_Board_ShipmentsRanking_CustomsCHNName cursor for 
            SELECT
                ifNull(Format((@rowNum := @rowNum + 1), 0), 0) AS rowNo, Declarations.HSCode,Declarations.sName, Declarations.TotalAmount,Declarations.ShippingQty
                FROM
                (
                    (SELECT
                    Sum(DeclarationsLine.CustomsAccount * (ifNull((Select Rate From Dic_Currency Where CurrencyCode=Declarations.Currency Limit 0,1),1)) / (ifNull((Select Rate From Dic_Currency Where CurrencyCode='USD' Limit 0,1),1))) AS TotalAmount, 
                    SUM(DeclarationsLine.ShippingQty) AS ShippingQty,
                    DeclarationsLine.HSCode,
                    concat(DeclarationsLine.CHNItemName, '(', DeclarationsLine.HSCode, ')') as sName, 
                    'dollars' AS Unit
                    FROM
                    DeclarationsLine
                    Left Join Declarations
                        On Declarations.rid = DeclarationsLine.pid
                    WHERE Declarations.ShippingDate BETWEEN concat(
                        DATE_SUB(
                        CURDATE(), INTERVAL DAYOFYEAR(CURDATE()) - 1 DAY
                        ), ' 00:00:00'
                    )
                    AND concat(CURDATE(), ' 23:59:59')
                    GROUP BY DeclarationsLine.HSCode
                    ORDER BY TotalAmount DESC
                    LIMIT 0, 10) Declarations,
                    (SELECT
                    (@rowNum := 0)) tROWS
                );
        /*指定游标循环结束时的返回值 */
        declare continue handler for not found set Done =1; 
        /*打开游标*/
        open Cursor_Board_ShipmentsRanking_CustomsCHNName;
        /*循环开始*/
        flag_loop_ShipmentsRanking_CustomsCHNName:loop
        /*给游标变量赋值*/
        fetch Cursor_Board_ShipmentsRanking_CustomsCHNName into iRowNo,sHSCode,sName,fTotalAmount,fShippingQty; 
        /*判断游标的循环是否结束*/
        if Done then 
            leave flag_loop_ShipmentsRanking_CustomsCHNName ; 
        end if ;
        set fLastTotalAmount = 0;
        set fGlowRate = 0;
        set iLastRowNo = 0;
        if (iRowNo=1) then
           set sItemName = (Select concat('<a class="ui orange circular label">', iRowNo , '</a>' , '&nbsp;' , sName)); 
        elseif (iRowNo=2) then
            set sItemName = (Select concat('<a class="ui yellow circular label">', iRowNo , '</a>' , '&nbsp;' , sName));
        elseif (iRowNo=3) then
            set sItemName = (Select concat('<a class="ui olive circular label">', iRowNo , '</a>' , '&nbsp;' , sName));
        else
            set sItemName = (Select concat('<a class="ui circular label">', iRowNo , '</a>' , '&nbsp;' , sName));
        end if;
        -- 去年同期销售额
        set fLastTotalAmount=(SELECT
                                IFNULL(SUM(DeclarationsLine.CustomsAccount * (ifNull((Select Rate From Dic_Currency Where CurrencyCode=Declarations.Currency Limit 0,1),1)) / (ifNull((Select Rate From Dic_Currency Where CurrencyCode='USD' Limit 0,1),1))), 0) AS TotalOrderAmount
                                FROM
                                DeclarationsLine
                                Left Join Declarations
                                    On Declarations.rid = DeclarationsLine.pid
                                WHERE Declarations.ShippingDate between concat(
                                    DATE_SUB(
                                    DATE_SUB(
                                        CURDATE(), INTERVAL dayofyear(CURDATE()) - 1 DAY
                                    ), INTERVAL 1 YEAR
                                    ), ' 00:00:00'
                                )
                                and concat(
                                    DATE_SUB(curdate(), INTERVAL 1 YEAR), ' 23:59:59'
                                )
                                AND DeclarationsLine.HSCode = sHSCode);
        if (fTotalAmount - fLastTotalAmount > 0 and fLastTotalAmount > 0) then
            set fGlowRate = (Select round((fTotalAmount-fLastTotalAmount)/fLastTotalAmount,2));
            set sItemValue = (Select concat('$' , fTotalAmount , '/' , fShippingQty , sUp , '销售额同比增长',fGlowRate,'%></i>'));        
        elseif (fTotalAmount - fLastTotalAmount < 0 and fLastTotalAmount > 0) then
            set fGlowRate = (Select round((fTotalAmount-fLastTotalAmount)/fLastTotalAmount,2));
            set sItemValue = (Select concat('$' , fTotalAmount , '/' , fShippingQty , sDown , '销售额同比下降',fGlowRate,'%></i>'));  
        else
            set sItemValue = (Select concat('$' , fTotalAmount , '/' , fShippingQty , sLevel));
        end if;
        -- 去年同期排名
        set iLastRowNo = (
                        SELECT
                            ifNull(rowNo,0) as rowNo
                            From
                            (SELECT
                                ifNull(Format((@rowNum := @rowNum + 1), 0), 0) AS rowNo, Declarations.HSCode, Declarations.sName, Declarations.TotalAmount
                                FROM
                                (
                                    (SELECT
                                    Sum(DeclarationsLine.CustomsAccount * (ifNull((Select Rate From Dic_Currency Where CurrencyCode=Declarations.Currency Limit 0,1),1)) / (ifNull((Select Rate From Dic_Currency Where CurrencyCode='USD' Limit 0,1),1))) AS TotalAmount, DeclarationsLine.HSCode, concat(
                                        DeclarationsLine.ENGItemName, '(', DeclarationsLine.HSCode, ')'
                                    ) as sName, 'dollars' AS Unit
                                    FROM
                                    DeclarationsLine
                                    Left Join Declarations
                                        On Declarations.rid = DeclarationsLine.pid
                                    WHERE Declarations.ShippingDate BETWEEN concat(
                                        DATE_SUB(
                                        DATE_SUB(
                                            CURDATE(), INTERVAL DAYOFYEAR(CURDATE()) - 1 DAY
                                        ), INTERVAL 1 YEAR
                                        ), ' 00:00:00'
                                    )
                                    AND concat(
                                        DATE_SUB(CURDATE(), INTERVAL 1 YEAR), ' 23:59:59'
                                    )
                                    GROUP BY DeclarationsLine.HSCode
                                    ORDER BY TotalAmount DESC
                                    LIMIT 0, 10) Declarations,
                                    (SELECT
                                    (@rowNum := 0)) tROWS
                                )) TLastDeclarations
                            Where TLastDeclarations.HSCode = sHSCode);
        if (iRowNo - iLastRowNo > 0 and iLastRowNo > 0) then
            set iGlowNo = (iRowNo - iLastRowNo);
            set sItemValue = (Select concat(sItemValue, sDown , '销售排名同比下降', iGlowNo ,'名></i>')); 
        elseif (iRowNo - iLastRowNo < 0 and iLastRowNo > 0) then
            set iGlowNo = (iLastRowNo - iRowNo);
            set sItemValue = (Select concat(sItemValue, sUp , '销售排名同比上升', iGlowNo ,'名></i>')); 
        else
            set sItemValue = (Select concat(sItemValue , sLevel));
        end if;
        insert into Board_ShipmentsRanking_CustomsCHNName(ItemName,ItemValue) values (sItemName,sItemValue);
        end loop;  /*循环结束*/
        close Cursor_Board_ShipmentsRanking_CustomsCHNName;/*关闭游标*/
    end;
    -- <循环创建虚拟表记录end>  
end $ 
delimiter ;