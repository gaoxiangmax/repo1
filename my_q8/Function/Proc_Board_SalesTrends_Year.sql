/*
看板-销售趋势-年
*/
delimiter $ 
drop procedure if exists Proc_Board_SalesTrends_Year $
create procedure Proc_Board_SalesTrends_Year()
begin
    declare iRows int;
    declare iSYear int;
    declare iEYear int;
    declare j int default 1;
    declare sUnit varchar(10);
    /*建内存表*/
    create table if not exists Board_SalesTrends_Year (
            sSeries varchar(255),
            sCategories varchar(255),
            fValue decimal(18,2)); 
    truncate TABLE Board_SalesTrends_Year;  -- 使用前先清空内存表。
    set iRows=12;
    set iSYear=(Select DATE_FORMAT(DATE_SUB(DATE_SUB(now(), INTERVAL 2 YEAR) ,INTERVAL dayofyear(now())-1 DAY),'%Y'));
    set iEYear=(Select DATE_FORMAT(now(),'%Y'));
    
    -- 新建横坐标 
    while(iSYear<=iEYear) do
    set j=1;
    while(j<=iRows) do   
        Insert Into Board_SalesTrends_Year
                    (sSeries,
                    sCategories,
                    fValue
                        )
                        values 
                        (convert(iSYear,char),
                        (case j
                                When 1 Then 'Jan' 
                                When 2 Then 'Feb'
                                When 3 Then 'Mar'
                                When 4 Then 'Apr'
                                When 5 Then 'May'
                                When 6 Then 'June'
                                When 7 Then 'July'
                                When 8 Then 'Aug'
                                When 9 Then 'Sept'
                                When 10 Then 'Oct'
                                When 11 Then 'Nov'
                                else 'Dec' end),
                        0
                        );
        set j=j+1;  
    end while;  
    set iSYear=iSYear+1;
    end while;

    -- 归类数据并填充
    Update Board_SalesTrends_Year set fValue=ifnull((
    Select round(SUM(ConvertUSD),2) as Amount 
    From SalesOrders 
    Where OrderDate >= concat(DATE_SUB(DATE_SUB(curdate(), INTERVAL 2 YEAR) ,INTERVAL dayofyear(curdate())-1 DAY),' 00:00:00') 
        and OrderDate < concat(curdate(),' 23:59:59')
        and SalesOrderStatus not in ('待确认','已作废') 
        and convert(YEAR(OrderDate),char)=sSeries 
        and (case MONTH(OrderDate)
                            When 1 Then 'Jan' 
                            When 2 Then 'Feb'
                            When 3 Then 'Mar'
                            When 4 Then 'Apr'
                            When 5 Then 'May'
                            When 6 Then 'June'
                            When 7 Then 'July'
                            When 8 Then 'Aug'
                            When 9 Then 'Sept'
                            When 10 Then 'Oct'
                            When 11 Then 'Nov'
                            else 'Dec' end)=sCategories
    Group By MONTH(OrderDate), YEAR(OrderDate) Order By YEAR(OrderDate)),0);       
end $ 
delimiter ;