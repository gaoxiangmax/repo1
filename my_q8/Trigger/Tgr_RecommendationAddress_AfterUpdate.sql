/*
产品推荐
*/
delimiter $
drop trigger if exists Tgr_RecommendationAddress_AftereUpdate $
create trigger Tgr_RecommendationAddress_AftereUpdate after update
on RecommendationAddress 
for each row
begin
    /*定义变量*/
    declare sNewCustomerShortName varchar(255); 
    declare sOldCustomerShortName varchar(255); 
    set sNewCustomerShortName=new.CustomerShortName;
    set sOldCustomerShortName=old.CustomerShortName;
    if ifNull(sNewCustomerShortName,'')<>ifNull(sOldCustomerShortName,'') then
        call Proc_Customers_LastRecommend(sNewCustomerShortName);-- 客户资料-最近推荐 
        call Proc_Customers_LastRecommend(sOldCustomerShortName);-- 客户资料-最近推荐 
    end if;
end$
/*恢复结束符为;*/
delimiter ;