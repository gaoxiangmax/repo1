/*
付款申请-费用明细
*/
delimiter $
 drop trigger if exists Tgr_ApplyForPaymentsDetail_AftereInsert $
 create trigger Tgr_ApplyForPaymentsDetail_AftereInsert after insert
 on ApplyForPaymentsDetail 
 for each row
 begin
    declare sKeyModaul varchar(255);
    declare sKeyNo varchar(255);
    set sKeyModaul=new.KeyModaul;
    set sKeyNo=new.KeyNo;
   if sKeyModaul='收样管理' then
        call Proc_ReceiveSamples_SumAppliedChargeed(sKeyNo);-- 收样管理-已申快件费
        call Proc_ReceiveSamples_SumAppliedForPayment(sKeyNo);-- 收样管理-已申请样品费
    end if;
    if sKeyModaul='寄样管理' then
        call Proc_SendSamples_SumAppliedForPayment(sKeyNo);-- 寄样管理-已申请付款
    end if;
     if ifNull(sKeyModaul,'')='开票通知' then
            call Proc_BillNotifies_AppliedForPayment(sKeyNo);-- 开票通知-已申请货款
    end if;
    if sKeyModaul='出运明细' then
        call Proc_Shipments_SumAppliedForOverSeas(sKeyNo);-- 出运明细-已申请国外
        call Proc_Shipments_SumAppliedForDomestic(sKeyNo);-- 出运明细-已申请国内
    end if;

       if sKeyModaul='采购合同' then
        call Proc_PurchaseOrders_AppliedForPayment(sKeyNo);-- 采购合同-已申请定金
    end if;
 end$
 delimiter ;