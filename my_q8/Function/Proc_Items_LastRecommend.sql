/*
产品资料-最近推荐
*/
delimiter $ 
drop procedure if exists Proc_Items_LastRecommend $
create procedure Proc_Items_LastRecommend(sItemNo varchar(255)) 
begin
    Update Items set LastRecommend = (Select Recommendation.Date From Recommendation,RecommendationItems Where Recommendation.rid=RecommendationItems.pid and
        RecommendationItems.ItemNo=sItemNo Order By Recommendation.sid Desc Limit 0,1) Where ItemNo=sItemNo;
end $ 
delimiter ;