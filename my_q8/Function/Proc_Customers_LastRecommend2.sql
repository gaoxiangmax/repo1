/*
客户资料-最近推荐
*/
delimiter $ 
drop procedure if exists Proc_Customers_LastRecommend2 $
create procedure Proc_Customers_LastRecommend2(sCustomerShortName varchar(255)) 
begin
    declare dLastRecommend date;
    set dLastRecommend=(Select Recommendation.Date From Recommendation,RecommendationAddress Where Recommendation.rid=RecommendationAddress.pid and
        RecommendationAddress.CustomerShortName=sCustomerShortName Order By Recommendation.sid Desc Limit 0,1);
    Update Customers set LastRecommend = dLastRecommend Where CustomerShortName=sCustomerShortName;
end $ 
delimiter ;