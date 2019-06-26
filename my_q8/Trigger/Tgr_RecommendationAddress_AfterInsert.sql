/*
产品推荐
*/
delimiter $
drop trigger if exists Tgr_RecommendationAddress_AftereInsert $
create trigger Tgr_RecommendationAddress_AftereInsert after insert
on RecommendationAddress 
for each row
begin
    call Proc_Customers_LastRecommend(new.CustomerShortName);-- 客户资料-最近推荐 
end$
/*恢复结束符为;*/
delimiter ;