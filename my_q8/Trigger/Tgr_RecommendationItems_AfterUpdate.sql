/*
产品推荐-产品资料
*/
delimiter $
drop trigger if exists Tgr_RecommendationItems_AftereUpdate $
create trigger Tgr_RecommendationItems_AftereUpdate after update
on RecommendationItems 
for each row
begin
    /*定义变量*/
    declare sNewItemNo varchar(255); 
    declare sOldItemNo varchar(255); 
    set sNewItemNo=new.ItemNo;
    set sOldItemNo=old.ItemNo;
    if ifNull(sNewItemNo,'')<>ifNull(sOldItemNo,'') then
        call Proc_Items_LastRecommend(sNewItemNo);-- 客户资料-最近推荐 
        call Proc_Items_LastRecommend(sOldItemNo);-- 客户资料-最近推荐
    end if;
end$
/*恢复结束符为;*/
delimiter ;