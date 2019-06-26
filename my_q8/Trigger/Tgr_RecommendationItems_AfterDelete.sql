/*
产品推荐-产品资料
*/
delimiter $
drop trigger if exists Tgr_RecommendationItems_AftereDelete $
create trigger Tgr_RecommendationItems_AftereDelete after delete
on RecommendationItems 
for each row
begin
    call Proc_Items_LastRecommend(old.ItemNo);-- 客户资料-最近推荐 
end$
/*恢复结束符为;*/
delimiter ;