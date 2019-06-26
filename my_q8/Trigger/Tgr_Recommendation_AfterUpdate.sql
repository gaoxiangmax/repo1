/*
产品推荐
*/
delimiter $
drop trigger if exists Tgr_Recommendation_AftereUpdate $
create trigger Tgr_Recommendation_AftereUpdate after update
on Recommendation 
for each row
begin
    /*定义变量*/ 
    declare spid varchar(255);
    declare dNewDate date;
    declare dOldDate date;
    set dNewDate=new.Date;
    set spid=new.rid;
    set dOldDate=old.Date;
    if ifNull(dNewDate,'')<>ifNull(dOldDate,'') then
        begin
            /*定义变量*/
            declare sCustomerShortName varchar(255); 
            /*定义结束标志变量*/
            declare Done int default 0;
            /*定义游标 以及赋值*/
            declare Cursor_Recommendation_AftereUpdate_RecommendationAdress cursor for 
            Select CustomerShortName From RecommendationAddress Where pid=spid;
            /*指定游标循环结束时的返回值 */
            declare continue handler for not found set Done =1; 
            /*打开游标*/
            open Cursor_Recommendation_AftereUpdate_RecommendationAdress;
            /*循环开始*/
            flag_loop_RecommendationAdress:loop
            /*给游标变量赋值*/
            fetch Cursor_Recommendation_AftereUpdate_RecommendationAdress into sCustomerShortName; 
            /*判断游标的循环是否结束*/
            if Done then 
                leave flag_loop_RecommendationAdress ; 
            end if ;
                call Proc_Customers_LastRecommend2(sCustomerShortName);-- 客户资料-最近推荐 
            end loop;  /*循环结束*/
            close Cursor_Recommendation_AftereUpdate_RecommendationAdress;/*关闭游标*/
        end;
    end if;
end$
/*恢复结束符为;*/
delimiter ;