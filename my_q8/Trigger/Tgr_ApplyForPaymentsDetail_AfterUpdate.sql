/*
付款申请-费用明细
*/
delimiter $
drop trigger if exists Tgr_ApplyForPaymentsDetail_AftereUpdate $
create trigger Tgr_ApplyForPaymentsDetail_AftereUpdate after update
on ApplyForPaymentsDetail 
for each row
begin
    /*定义变量*/
    declare sNewKeyNo varchar(255);
    declare sOldKeyNo varchar(255); 
    declare sNewKeyModaul varchar(255);
    declare sOldKeyModaul varchar(255); 
    declare fNewApplyAmount decimal(18,2);
    declare fOldApplyAmount decimal(18,2);
    set sNewKeyNo=new.KeyNo;
    set sOldKeyNo=old.KeyNo;
    set sNewKeyModaul=new.KeyModaul;
    set sOldKeyModaul=old.KeyModaul;
    set fNewApplyAmount=new.ApplyAmount;
    set fOldApplyAmount=old.ApplyAmount;
    if ifNull(sNewKeyNo,'')<>ifNull(sOldKeyNo,'') or ifNull(sNewKeyModaul,'')<>ifNull(sOldKeyModaul,'') or fNewApplyAmount<>fOldApplyAmount then
        if ifNull(sNewKeyModaul,'')='收样管理' then
            call Proc_ReceiveSamples_SumAppliedChargeed(sNewKeyNo);-- 收样管理-已申快件费
            call Proc_ReceiveSamples_SumAppliedForPayment(sNewKeyNo);-- 收样管理-已申请样品费
        end if;
        if ifNull(sNewKeyModaul,'')='寄样管理' then
            call Proc_SendSamples_SumAppliedForPayment(sNewKeyNo);-- 寄样管理-已申请付款
        end if;
        if ifNull(sNewKeyModaul,'')='开票通知' then
                call Proc_BillNotifies_AppliedForPayment(sNewKeyNo);-- 开票通知-已申请货款
        end if;
        if ifNull(sNewKeyModaul,'')='出运明细' then
            call Proc_Shipments_SumAppliedForOverSeas(sNewKeyNo);-- 出运明细-已申请国外
            call Proc_Shipments_SumAppliedForDomestic(sNewKeyNo);-- 出运明细-已申请国内
        end if;

        if ifNull(sOldKeyModaul,'')='收样管理' then
            call Proc_ReceiveSamples_SumAppliedChargeed(sOldKeyNo);-- 收样管理-已申快件费
            call Proc_ReceiveSamples_SumAppliedForPayment(sOldKeyNo);-- 收样管理-已申请样品费
        end if;
        if ifNull(sOldKeyModaul,'')='寄样管理' then
            call Proc_SendSamples_SumAppliedForPayment(sOldKeyNo);-- 寄样管理-已申请付款
        end if;
        if ifNull(sOldKeyModaul,'')='开票通知' then
            call Proc_BillNotifies_AppliedForPayment(sOldKeyNo);-- 开票通知-已申请货款
        end if;
        if ifNull(sOldKeyModaul,'')='出运明细' then
            call Proc_Shipments_SumAppliedForOverSeas(sOldKeyNo);-- 出运明细-已申请国外
            call Proc_Shipments_SumAppliedForDomestic(sOldKeyNo);-- 出运明细-已申请国内
        end if;
        if ifNull(sNewKeyModaul,'')='采购合同' then
            call Proc_PurchaseOrders_AppliedForPayment(sOldKeyNo);-- 采购合同-已申请定金
        end if;
    end if;
end$
delimiter ;