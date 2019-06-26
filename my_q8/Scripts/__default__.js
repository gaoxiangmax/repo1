//合并js时放在最前面，\iCloud\books\Q8\development\iCloudExtend.js
//---判断是否数组
VLIB.isArray = function (o) {
    return Object.prototype.toString.call(o) == '[object Array]';
}

//<------------------------单元集_判断数组中值是否重复------------------------->
VLIB.isRepeat = function (arr) {
    var hash = {};
    for (var i in arr) {
        if (hash[arr[i]]) //hash 哈希    
            return true;
        hash[arr[i]] = true;
    }
    return false;
}

//<------------------------单元集_数组去重------------------------->
VLIB.dedupe = function (arr) {
    return Array.from(new Set(arr));
}

//<------------------------单元集_去除rid的+和*------------------------->
VLIB.getPureRID = function (rid) {
    return rid.replace('+', '').replace('*', '')
}

//<------------------------单元集_cxTermOfPrice------------------------>
VLIB.cxTermOfPrice = function (obj) {
    //---FCA、CPT、CIP对应于FOB、CFR、CIP，报价算法一致，仅仅因为FCA等不限于海运，运输范围更广。
    //---EXW为工厂交货，即F0B-国内运费
    //---FAS为船边交货，已停用
    //---DDP为税后交货，即卖方需支付完买方的进口关税及运费后交到指定目的地，无固定计算公式。
    var self = obj.form;
    if (self.field) {
        var sTermOfPrice = (self.recordSet.fieldByName('价格条款').val()).toUpperCase();
        if (self.recordSet.fieldByName('单位运费')) {
            if (sTermOfPrice.indexOf('CNF') >= 0 || sTermOfPrice.indexOf('CFR') >= 0 || sTermOfPrice.indexOf('CIF') >= 0 || sTermOfPrice.indexOf('CPT') >= 0 || sTermOfPrice.indexOf('CIP') >= 0) {
                self.field('单位运费').show();
                if ((self.recordJob && (self.recordJob == 'new' || self.recordJob == 'copy')) || (obj.evtID == EVT_RECORDSET_AFTER_FIELD_CHANGED && obj.field.fullName.indexOf('价格条款') > -1)) {
                    if (!self.field('单位运费').isHide()) {
                        self.recordSet.fieldByName('单位运费').val(0);
                    }
                }
            } else {
                self.field('单位运费').hide();
            }
        }
        if (self.recordSet.fieldByName('保险加成') && self.recordSet.fieldByName('保险比率')) {
            if (sTermOfPrice.indexOf('CIF') >= 0 || sTermOfPrice.indexOf('CIP') >= 0) {
                self.field('保险加成').show();
                self.field('保险比率').show();
            } else {
                self.field('保险加成').hide();
                self.field('保险比率').hide();
            }
            if ((self.recordJob && (self.recordJob == 'new' || self.recordJob == 'copy')) || obj.evtID == EVT_RECORDSET_AFTER_FIELD_CHANGED) {
                if (self.field('保险加成').isHide()) {
                    self.recordSet.fieldByName('保险加成').val(0);
                    self.recordSet.fieldByName('保险比率').val(0);
                } else {
                    self.recordSet.fieldByName('保险加成').val(110);
                    self.recordSet.fieldByName('保险比率').val(0.5);
                }
            }
        }
    }
};

//<------------------------单元集_cxQuotationFormula------------------->
VLIB.cxQuotationFormula = function (obj, sType) {
    var Settlement, PriceModel, Exporter, TermOfPrice;
    var UnitFreight, PlusInsurance, Commission, ExchangeRate, StandardRate, iVAT;
    var GetCurrencyRate = function (sCurrency) {
        try {
            var fResult;
            if (sCurrency == 'RMB' || sCurrency == 'CNY') {
                fResult = 1;
            } else {
                var oTxt = {
                    "values": {
                        "sCurrency": sCurrency
                    }
                }
                var oSQL = _.db.execute('VLIB_cxQuotationFormula_GetCurrencyRate', oTxt);
                if (oSQL.length > 0) {
                    fResult = _.convert.toFloat(oSQL[0].Rate);
                } else {
                    fResult = 0;
                }
            }
            return fResult;
        } catch (err) {
            _.log.error('获取汇率错误!');
        }
    };

    var GetRebates = function (PHCurrency, ERRate, iVAT, PHPrice) {
        var fResult = 0;
        if (PHCurrency == 'RMB' || PHCurrency == 'CNY') {
            switch (Settlement) {
                case '自营出口':
                    fResult = PHPrice * ERRate / iVAT;
                    return fResult;
                    break;
                case '代理出口':
                    fResult = 0;
                    return fResult;
            }
        }
    };

    var cxFormulaPrice = function () {
        var ProfitRate = obj.recordSet.fieldByName('产品资料.利润率').val() / 100;
        var PurchPrice = obj.recordSet.fieldByName('产品资料.采购单价').val();
        var PurchCurrency = obj.recordSet.fieldByName('产品资料.采购币种').val();
        var PurchCurrencyRate = GetCurrencyRate(PurchCurrency);
        var ExportRebatesRate = obj.recordSet.fieldByName('产品资料.退税率').val();
        var sKey = Exporter.concat(ExportRebatesRate);
        var fValue = window.intersky["oDic_SettlementRate"][sKey];
        var fSettlementRatio = 1; //默认结汇比为1
        if (fValue) {
            var fSettlementRatio = fValue;
        }
        var FobPrice, SalePrice;
        var AUnitFreight;
        if (obj.recordSet.fieldByName('产品资料.外箱装量').val() != 0) {
            AUnitFreight = (UnitFreight * obj.recordSet.fieldByName('运费汇率').val() /
                ExchangeRate) * obj.recordSet.fieldByName('产品资料.外箱体积').val() / obj.recordSet.fieldByName('产品资料.外箱装量').val();
        }
        switch (PriceModel + '-' + Settlement) {
            case '利润率算销售价-自营出口':
                //---若不开票，则采购单价为不含税价，反之。
                if (obj.recordSet.fieldByName('产品资料.是否开票').val() == true) {
                    FobPrice = (PurchPrice * PurchCurrencyRate - GetRebates(PurchCurrency, ExportRebatesRate, iVAT, PurchPrice)) / ExchangeRate * (1 + ProfitRate); //FOB价格=(采购单价*采购币种汇率-退税)/销售币种汇率*（1+利润率/100）   
                } else {
                    FobPrice = PurchPrice * PurchCurrencyRate / ExchangeRate * (1 + ProfitRate);
                }
                if (TermOfPrice == 'CNF' || TermOfPrice == 'C&F' || TermOfPrice == 'CPT') {
                    SalePrice = FobPrice + FobPrice * Commission + AUnitFreight; //销售单价=FOB价格+FOB价格*佣金比率/100+单位运费   
                } else if (TermOfPrice == 'CIF' || TermOfPrice == 'CIP') {
                    SalePrice = FobPrice + FobPrice * PlusInsurance + FobPrice * Commission + AUnitFreight; //销售价格=FOB价格+FOB价格*保险加成*保险比率/10000+FOB价格*佣金比率/100+单位运费  
                } else {
                    SalePrice = FobPrice + FobPrice * Commission;
                }
                obj.recordSet.fieldByName('产品资料.销售单价').val(SalePrice.toFixed(3)); //销售单价=FOB价格+FOB价格*佣金比率/100
                break;
            case '利润率算销售价-代理出口':
                if (StandardRate > 0) {
                    var BuyoutPrice = ExchangeRate / StandardRate * fSettlementRatio;
                    if (BuyoutPrice != 0) {
                        FobPrice = PurchPrice * PurchCurrencyRate / BuyoutPrice * (1 + ProfitRate);
                        if (TermOfPrice == 'CNF' || TermOfPrice == 'C&F' || TermOfPrice == 'CPT') {
                            SalePrice = FobPrice + FobPrice * Commission + AUnitFreight;
                        } else if (TermOfPrice == 'CIF' || TermOfPrice == 'CIP') {
                            SalePrice = FobPrice + FobPrice * PlusInsurance + FobPrice * Commission + AUnitFreight;
                        } else SalePrice = FobPrice + FobPrice * Commission;
                        obj.recordSet.fieldByName('产品资料.销售单价').val(SalePrice.toFixed(3));
                    }
                }
        }
    };

    var cxFormulaProfit = function () {
        var SalePrice = obj.recordSet.fieldByName('产品资料.销售单价').val();
        var PurchPrice = obj.recordSet.fieldByName('产品资料.采购单价').val();
        var PurchCurrency = obj.recordSet.fieldByName('产品资料.采购币种').val();
        var PurchCurrencyRate = GetCurrencyRate(PurchCurrency);
        var ExportRebatesRate = obj.recordSet.fieldByName('产品资料.退税率').val();
        var sKey = Exporter.concat(ExportRebatesRate);
        var fValue = window.intersky["oDic_SettlementRate"][sKey];
        var fSettlementRatio = 1; //默认结汇比为1
        if (fValue) {
            var fSettlementRatio = fValue;
        }
        var BuyoutPrice;
        if (obj.recordSet.fieldByName('产品资料.外箱装量').val() != 0) {
            var AUnitFreight = (UnitFreight * obj.recordSet.fieldByName('运费汇率').val() / ExchangeRate) *
                obj.recordSet.fieldByName('产品资料.外箱体积').val() / obj.recordSet.fieldByName('产品资料.外箱装量').val();
        }
        if (StandardRate > 0) {
            var BuyoutPrice = ExchangeRate / StandardRate * fSettlementRatio;
        } else BuyoutPrice = 0;
        var FobPrice = SalePrice * (1 - PlusInsurance - Commission) - AUnitFreight;
        var Rebates = GetRebates(PurchCurrency, ExportRebatesRate, iVAT, PurchPrice);
        var fNum = PurchPrice * PurchCurrencyRate;
        if (fNum != 0) {
            switch (PriceModel + '-' + Settlement) {
                case '直接销售价-自营出口':
                    if (obj.recordSet.fieldByName('产品资料.是否开票').val() == true) {
                        var fProfit = (FobPrice * ExchangeRate + Rebates - PurchPrice * PurchCurrencyRate) / (PurchPrice * PurchCurrencyRate - Rebates) * 100;
                        obj.recordSet.fieldByName('产品资料.利润率').val(fProfit.toFixed(2));
                    } else {
                        var fProfit = (FobPrice * ExchangeRate - PurchPrice * PurchCurrencyRate) / (PurchPrice * PurchCurrencyRate) * 100;
                        obj.recordSet.fieldByName('产品资料.利润率').val(fProfit.toFixed(2));
                    }
                    break;
                case '直接销售价-代理出口':
                    var fProfit = (FobPrice * BuyoutPrice / (PurchPrice * PurchCurrencyRate) - 1) * 100;
                    obj.recordSet.fieldByName('产品资料.利润率').val(fProfit.toFixed(2));
            }
        }
    };

    var cxFormulaAll = function () {
        var oTable = obj.recordSet.tableByName('产品资料');
        oTable.disableControl();
        var iBookMark = oTable.cursor();
        oTable.cursor(0, false);
        try {
            oTable.down(function () {
                if (PriceModel == '直接销售价') {
                    cxFormulaProfit(obj);
                } else {
                    cxFormulaPrice(obj);
                }
            });
        } finally {
            oTable.cursor(iBookMark, true);
            oTable.enableControl('Batch_default');
        }
    };

    //AType:= 'S' 计算当前单价
    //AType:= 'P' 计算当前利润率
    //AType:= 'A' 计算全部单价或利润率
    var sTermOfPrice = obj.recordSet.fieldByName('价格条款').val();
    TermOfPrice = sTermOfPrice.toUpperCase();
    ExchangeRate = obj.recordSet.fieldByName('汇率').val();
    PriceModel = obj.recordSet.fieldByName('报价模式').val();
    StandardRate = obj.recordSet.fieldByName('基准汇率').val();
    Settlement = obj.recordSet.fieldByName('结算类别').val();
    Exporter = obj.recordSet.fieldByName('我方公司').val();
    UnitFreight = obj.recordSet.fieldByName('单位运费').val();
    Commission = obj.recordSet.fieldByName('佣金比率').val() / 100;
    PlusInsurance = obj.recordSet.fieldByName('保险加成').val() * obj.recordSet.fieldByName('保险比率').val() / 10000;
    if (obj.recordSet.fieldByName('产品资料.增值税率').val() == 0) {
        iVAT = 113;
    } else {
        iVAT = 100 + obj.recordSet.fieldByName('产品资料.增值税率').val();
    }
    if (ExchangeRate != 0) {
        switch (sType) {
            case 'S':
                cxFormulaPrice(obj);
                break;
            case 'P':
                cxFormulaProfit(obj);
                break;
            case 'A':
                cxFormulaAll(obj);
        }
    }
};

//<------------------------单元集_cxPurchTotal------------------------->
VLIB.cxPurchTotal = function (self, sDetailName, isEXW) {
    isEXW = arguments[2] ? arguments[2] : false;
    if (!self.recordSet.fieldByName('价格条款') || !self.recordSet.fieldByName('结算类别') || !self.recordSet.fieldByName('采购合计') || !self.recordSet.fieldByName('结算类别'))
        var sTermOfPrice = self.recordSet.fieldByName('价格条款').val();
    var sSettlement = self.recordSet.fieldByName('结算类别').val();
    var fTaxRebate = 0;
    var iVAT = 113;
    var fTotal = 0;
    var fTotalTaxRebate = 0;
    var fPurchAmount = 0;
    if (!self || !sDetailName) {
        return;
    }
    var oDetailData = self.recordSet.tables[sDetailName].data;
    for (var i in oDetailData) {
        fTaxRebate = 0;
        if (oDetailData[i].VAT > 0) {
            iVAT = 100 + oDetailData[i].VAT;
        }
        fPurchAmount = oDetailData[i].PurchaseAmount;
        if ((oDetailData[i].PurchaseCurrency == 'RMB' || oDetailData[i].PurchaseCurrency == 'CNY') && (sTermOfPrice != 'EXW' || (sTermOfPrice == 'EXW' && isEXW))) {
            if (sSettlement == '自营出口') {
                fTaxRebate = fPurchAmount * oDetailData[i].ExportRebatesRate / iVAT;
            }
        } else {
            var sKey = oDetailData[i].PurchaseCurrency;
            if (window.intersky["oDic_Currency_Rate"].hasOwnProperty(sKey)) {
                var fValue = window.intersky["oDic_Currency_Rate"][sKey];
            }
            if (fValue) {
                fPurchAmount = fPurchAmount * _.convert.toFloat(fValue);
            }
        }
        fTotalTaxRebate = fTotalTaxRebate + fTaxRebate;
        fTotal = fTotal + fPurchAmount;
    }
    self.recordSet.fieldByName('采购合计').val(fTotal.toFixed(2));
    self.recordSet.fieldByName('退税总额').val(fTotalTaxRebate.toFixed(2));
};

//<------------------------单元集_cxRightUnitSUM------------------------->
VLIB.cxRightUnitSUM = function (self, sTableName, sQty, sUnit, sTotal, sLeftOrRight, isNeedMix) {
    if (!self.recordSet.fieldByName(sTableName + '.' + sQty) || !self.recordSet.fieldByName(sTableName + '.' + sUnit) || !self.recordSet.fieldByName(sTotal)) {
        return false;
    }
    if (isNeedMix == undefined) {
        isNeedMix = true;
    }
    var fnUnionRightUnit = function (fQty, sUnitCode, sLeftOrRight) {
        var sResult;
        var oData = window.intersky["oDic_Unit_Singular_Plural"];
        if (oData && oData.hasOwnProperty(sUnitCode)) {
            if (sLeftOrRight == 'L' || sLeftOrRight == '') {
                if (fQty > 1) {
                    sResult = fQty + oData[sUnitCode][1];
                } else {
                    sResult = fQty + oData[sUnitCode][0];
                }
            } else {
                if (fQty > 1) {
                    sResult = oData[sUnitCode][1] + ':' + fQty;
                } else {
                    sResult = oData[sUnitCode][0] + ':' + fQty;
                }
            }
        } else {
            if (sLeftOrRight == 'L' || sLeftOrRight == '') {
                if (fQty > 1) {
                    sResult = fQty + '';
                } else {
                    sResult = fQty + '';
                }
            } else {
                if (fQty > 1) {
                    sResult = '' + ':' + fQty;
                } else {
                    sResult = '' + ':' + fQty;
                }
            }
        }
        return sResult;
    };

    if (isNeedMix) {
        var oUnitList = [];
        var oUnitAmount = [];
        var sTotalQty = '';
        var oTable = self.recordSet.tableByName(sTableName);
        oTable.disableControl();
        var iBookMark = oTable.cursor();
        oTable.cursor(0, false);
        try {
            oTable.down(function () {
                var sRecordUnit = self.recordSet.fieldByName(sTableName + '.' + sUnit).val() ? self.recordSet.fieldByName(sTableName + '.' + sUnit).val() : '(无单位);'
                var iExistedInd = oUnitList.indexOf(sRecordUnit);
                if (iExistedInd < 0) {
                    oUnitList.push(sRecordUnit);
                    oUnitAmount.push(self.recordSet.fieldByName(sTableName + '.' + sQty).val());
                } else {
                    oUnitAmount[iExistedInd] = oUnitAmount[iExistedInd] + self.recordSet.fieldByName(sTableName + '.' + sQty).val();
                }
            });
        } finally {
            oTable.cursor(iBookMark, true);
            oTable.enableControl('Batch_default3');
        }
        for (var i = 0; i < oUnitList.length; i++) {
            sTotalQty = sTotalQty + fnUnionRightUnit((_.convert.toFloat(oUnitAmount[i])).toFixed(2), oUnitList[i], sLeftOrRight) + ';';
        }
        if (sTotalQty.length > 0) {
            sTotalQty = sTotalQty.substr(0, sTotalQty.length - 1);
        }
    } else {
        var oTable = self.recordSet.tableByName(sTableName);
        var fTotalQty = 0;
        oTable.disableControl();
        var iBookMark = oTable.cursor();
        oTable.cursor(0, false);
        try {
            oTable.down(function () {
                fTotalQty = fTotalQty + self.recordSet.fieldByName(sTableName + '.' + sQty).val();
            });
        } finally {
            oTable.cursor(iBookMark, true);
            oTable.enableControl('Batch_default4');
            sTotalQty = fTotalQty.toFixed();
        }
    }
    self.recordSet.fieldByName(sTotal).val(sTotalQty);
};

//<------------------------单元集_cxSendInTimeMessage------------------------->
VLIB.cxSendInTimeMessage = function (aUserList, sInTimeMessage, isNotify) {
    if (isNotify == undefined) {
        isNotify = true;
    }
    if (!VLIB.isArray(aUserList) && aUserList.length > 0) {
        aUserList = [aUserList];
    } else if (aUserList.length == 0) {
        aUserList = [];
    }
    var aMSGUserList = [];
    var aList = aUserList;
    if (aList.length == 0) {
        _.ui.showInput({
            title: _.language.get('请选择要通知的人员:'),
            type: "multidropdown",
            value: "", //默认值
            fields: window.intersky.aAllUserList,
            onapprove: function (aNotify) {
                if (aNotify) {
                    aMSGUserList = aNotify;
                    for (var i = 0, k = aMSGUserList.length; i < k; i++) {
                        _.app.im.sendChatMessage(aMSGUserList[i], sInTimeMessage); //发送消息
                    }
                } else {
                    return aMSGUserList; //false则将选中的被通知人返回
                }
            }
        });
    } else {
        aMSGUserList = aList;
        if (isNotify) {
            _.app.im.sendChatMessage(aMSGUserList[0], sInTimeMessage); //发送消息
        } else {
            return aMSGUserList; //false则将选中的被通知人返回
        }
    }
};

//<------------------------单元集_判断审批------------------------->
VLIB.cxCheckWorkflowState = function (sModule, sRecord_id) {
    var res = 0;
    var oSQL = _.db.execute('CheckWorkflowState', {
        "values": {
            "sModule": sModule,
            "sRecord_id": sRecord_id
        }
    });
    if (oSQL.length > 0) {
        res = oSQL[0].state;
    } else {
        res = -1;
    }
    return res
};

//<------------------------单元集_cxAutoData------------------------->
//自动数据单元集第一稿是从CS版本照搬山来的，因此还有很多优化控件，比如减少与数据库交互等
VLIB.cxAutoData = function (obj, sSourceRecordID, sSourceKeyField, sTargetKeyField, sSourceSubKeyFields, sTargetMainKeyFields, sTargetIDField, bSendMSG, bAutomatic, callback) {
    if (sSourceSubKeyFields == undefined) {
        sSourceSubKeyFields = '';
    }
    if (sTargetMainKeyFields == undefined) {
        sTargetMainKeyFields = '';
    }
    if (sTargetIDField == undefined) {
        sTargetIDField = '';
    }
    if (bSendMSG == undefined) {
        bSendMSG = true;
    }
    if (bAutomatic == undefined) {
        bAutomatic = false;
    }
    //参数说明如下:
    //sSourceRecordID:=当前模块RecordID(如:Self.RecordID)
    //sSourceKeyField:=当前模块主关键字段(如:'采购计划.采购计划')
    //sTargetKeyField:=生成模块的主关键字段(如:'采购合同.采购计划')
    //sSourceSubKeyFields:=当前模块子表条件字段(多个以 ";" 号隔开)(如:'采购计划.采购明细.厂商编号;采购计划.采购明细.采购类型')
    //sTargetMainKeyFields:=生成模块主表关键字段(多个以 ";" 号隔开)(如:'采购合同.厂商编号;采购合同.采购类型')
    //sTargetIDField:=生成模块主表唯一关键字(如:'采购合同.采购合同')
    //注意:参数SourceKeyField与参数TargetKeyField,参数SourceSubKeyFields与参数TargetMainKeyFields 这二组参数字段数必须对等
    //bSendMSG：是否发送消息，默认发送
    //bAutomatic：目标模块是否使用自身的自动编号
    //注意:参数sSourceKeyField与参数sTargetKeyField,参数sSourceSubKeyFields与参数sTargetMainKeyFields 这二组参数字段数必须对等
    var fnSubExist = function (sRecordID, oModule, callback_fnSubExist) {
        var isResult = false;
        var oItems = oModule; //子表
        for (var i in oItems) {
            var oTxt = {
                "values": {
                    "sTableName": oItems[i],
                    "sRecordID": sRecordID
                }
            }
            var oSQL = _.db.execute('VLIB_cxAutoData_fnSubExist_rid', oTxt);
            if (oSQL.length > 0) {
                isResult = true;
            }
            if (isResult) break;
        }
        if (!isResult) {
            callback_fnSubExist(false);
        } else {
            callback_fnSubExist(true);
        }
    };

    var fnGetDelRecordIDs = function (sRecordID, callback_fnGetDelRecordIDs) {
        //---sSourceKeyField，如数据源模块采购计划的字段'采购计划.采购计划'
        var sKeyField = obj.module.fieldByName(sSourceKeyField).fieldName;
        var oTxt = {
            "values": {
                "sKeyField": sKeyField,
                "sTableName": _.project.moduleByFieldName(sSourceKeyField).tableName,
                "sRecordID": sRecordID
            }
        }
        var oSQL = _.db.execute('VLIB_cxAutoData_fnGetDelRecordIDs_sKeyField', oTxt);
        sFSourceKeyValue = oSQL[0][sKeyField] ? oSQL[0][sKeyField] : '';
        //---sTargetKeyField，如目标模块采购合同的字段'采购合同.采购计划'
        var oTxt = {
            "values": {
                "sTargetKeyTable": _.project.moduleByFieldName(sTargetKeyField).tableName,
                "sTargetKeyFieldName": _.project.modules.moduleByName(sTargetMouleName).fieldByName(sTargetKeyField).fieldName,
                "sFSourceKeyValue": sFSourceKeyValue
            }
        }
        var oSQL = _.db.execute('VLIB_cxAutoData_fnGetDelRecordIDs_rid', oTxt);
        //---查找目标模块是否存在对应数据，如查找采购合同的字段'采购合同.采购计划'是否存在，是则DelRecordIDs容器依次加rid即为要删除的目标模块记录，
        if (oSQL.length > 0) {
            for (var i in oSQL) {
                aDelRecordIDs.push(oSQL[i].rid);
            }
        }
        callback_fnGetDelRecordIDs(true); //回调表示待删除数据已搜索完毕
    };

    var fnDeleteRecord = function (sModule, callback_fnDeleteRecord) {
        //---承前GetDelRecordIDs函数，若目标模块无记录可删，则跳出该函数
        if (aDelRecordIDs.length == 0) {
            callback_fnDeleteRecord(true);
            return;
        } else {
            //---删除记录前提醒用户记录已存在，若点'否'则跳出该函数
            _.ui.yesOrNo(
                _.language.get('畅想软件自动生成:') + _.language.get('是否要覆盖原有数据并生成新数据?'),
                okfunc = function () {
                    //---删除记录前再次提醒用户记录已存在是否继续覆盖，若点'否'则跳出该函数
                    _.ui.yesOrNo(
                        _.language.get('畅想软件自动生成:') + _.language.get('覆盖原有数据,可能造成数据丢失,确定执行?'),
                        okfunc = function () {
                            var aDeleteList = aDelRecordIDs.slice(0); //待删除目标模块记录rid,拷贝数组
                            var sModuleName = sModule.name; //目标模块名

                            //判断目标模块记录归档、审批、是否有删除权限、采购合同已付定金的递归函数
                            var fnWorkflow_Archive_Earnest = function (sDelrid) {
                                // 归档
                                var bArchived = _.db.utils.queryArchived(sModuleName, sDelrid);
                                if (bArchived == true) {
                                    _.ui.Message({
                                        msg: _.language.get(sModuleName + '：' + '记录已归档，系统中止操作！'),
                                        center: "center",
                                        autoClose: true,
                                        showClose: false,
                                        type: 4,
                                        closeTime: 10000
                                    });
                                    callback_fnDeleteRecord(false);
                                    window.bAutoData = false;
                                    return;
                                }
                                // 审批
                                var iWorkflowState = VLIB.cxCheckWorkflowState(sModuleName, sDelrid);
                                if (iWorkflowState > -1) {
                                    _.ui.Message({
                                        msg: _.language.get(sModuleName + '：' + '记录已进入审批流程，系统中止操作！'),
                                        center: "center",
                                        autoClose: true,
                                        showClose: false,
                                        type: 4,
                                        closeTime: 10000
                                    });
                                    callback_fnDeleteRecord(false);
                                    window.bAutoData = false;
                                    return;
                                }
                                // 目标模块是否有删除权限
                                if (!_.app.permission.getModulePermission(sModuleName).delete) {
                                    _.ui.Message({
                                        msg: _.language.get(sModuleName + '：' + '您没有删除该模块的权限！'),
                                        center: "center",
                                        autoClose: true,
                                        showClose: false,
                                        type: 4,
                                        closeTime: 10000
                                    });
                                    callback_fnDeleteRecord(false);
                                    window.bAutoData = false;
                                    return;
                                }
                                // 采购合同已付定金
                                if (sModuleName == "采购合同") {
                                    var oTxt = {
                                        "values": {
                                            "rid": sDelrid
                                        }
                                    }
                                    var oSQL = _.db.execute('VLIB_cxAutoData_fnDeleteRecord_PurchaseOrderNo', oTxt);
                                    if (oSQL.length > 0) {
                                        var sPurchaseOrderNo = oSQL[0].PurchaseOrderNo ? oSQL[0].PurchaseOrderNo : '';
                                        var oTxt = {
                                            "values": {
                                                "sPurchaseOrderNo": sPurchaseOrderNo
                                            }
                                        }
                                        var oSQL2 = _.db.execute('VLIB_cxAutoData_fnDeleteRecord_rid', oTxt);
                                        if (oSQL2.length > 0) {
                                            _.ui.Message({
                                                msg: _.language.get('系统检测该合同已支付过定金或货款，中止操作！'),
                                                center: "center",
                                                autoClose: true,
                                                showClose: false,
                                                type: 4,
                                                closeTime: 10000
                                            });
                                            callback_fnDeleteRecord(false);
                                            window.bAutoData = false;
                                            return;
                                        }
                                    }
                                }
                                if (aDeleteList.length > 0) {
                                    fnWorkflow_Archive_Earnest(aDeleteList.shift());
                                } else if (aDeleteList.length == 0) {
                                    //删除数据
                                    if (window.bAutoData == undefined || window.bAutoData == true) {
                                        var fnDeleteReds = function (sDeleterid) {
                                            _.app.db.deleteModuleRecord(sTargetMouleName, sDeleterid, function () {
                                                if (aDelRecordIDs.length > 0) {
                                                    fnDeleteReds(aDelRecordIDs.shift());
                                                } else {
                                                    callback_fnDeleteRecord(true);
                                                }
                                            }, function () {}, true);
                                        }
                                        fnDeleteReds(aDelRecordIDs.shift());
                                    }
                                }
                            }
                            // 递归入口
                            fnWorkflow_Archive_Earnest(aDeleteList.shift());
                        },
                        cancelfunc = function () {
                            _.ui.Message({
                                msg: _.language.get('畅想软件自动生成:') + _.language.get('您已经取消了操作!'),
                                center: "center", //居中
                                autoClose: true, //是否自动关闭
                                showClose: false, //是否显示关闭按钮
                                type: 3, //info: 1, success: 2, warning: 3, error: 4
                                closeTime: 5000 //自动关闭时间
                            });
                            callback_fnDeleteRecord(false);
                            window.bAutoData = false;
                        }
                    );
                },
                cancelfunc = function () {
                    _.ui.Message({
                        msg: _.language.get('畅想软件自动生成:') + _.language.get('您已经取消了操作!'),
                        center: "center", //居中
                        autoClose: true, //是否自动关闭
                        showClose: false, //是否显示关闭按钮
                        type: 3, //info: 1, success: 2, warning: 3, error: 4
                        closeTime: 5000 //自动关闭时间
                    });
                    callback_fnDeleteRecord(false);
                    window.bAutoData = false;
                }

            );
        }
    };

    var fnGetSubKeyValue = function (sRecordID) {
        var sCondition, sTSql, sCnTSql, sNotSelect;
        var iResult = 0;
        sTSql = '';
        //---当前模块子表对应条件作为select的对象，如采购计划的字段'产品资料.厂商编号;产品资料.采购员'
        for (var i in aFSourceSubKeyFields) {
            sTSql = sTSql + obj.module.fieldByName(aFSourceSubKeyFields[i]).fieldName + ',';
        }
        var sSubTSql = sTSql.substr(0, sTSql.length - 1);
        var iSt = aFSourceSubKeyFields[i].indexOf('.') + 1;
        var iEd = aFSourceSubKeyFields[i].indexOf('.', iSt);
        var sSourceSubName = aFSourceSubKeyFields[i].substr(iSt, iEd - iSt); //子表名
        var sSourceSubTableName = _.project.moduleByFieldName(aFSourceSubKeyFields[i]).groupByName(sSourceSubName).tableName; //子表表名
        if (sTargetMouleName == '商检单据') {
            sCondition = '"' + sRecordID + '" And InspectionMark="需商检"';
            sNotSelect = _.language.get('商检标志') + '\n' + _.language.get('其中某些未选择,数据无法生成');
        } else if (sTargetMouleName == '开票通知') {
            sCondition = '"' + sRecordID + '" And CanBill=1 And declaration=1';
            sNotSelect = _.language.get('是否开票') + '\n' + _.language.get('其中某些未选择,数据无法生成');
        } else {
            sCondition = '"' + sRecordID + '"';
        }
        var oTxt = {
            "values": {
                "sSubTSql": sSubTSql,
                "sSourceSubTableName": sSourceSubTableName,
                "sCondition": sCondition
            }
        }
        var oSQL = _.db.execute('VLIB_cxAutoData_fnGetSubKeyValue_Inspections', oTxt);
        //---查找若目标模块是商检单据的，且当前模块子表无需商检产品，则不予生成；若目标模块为开票通知，且当前模块子表无需开票或子表为空，不予生成
        if (oSQL.length == 0) {
            sTSql = '';
            for (var i in aFSourceSubKeyFields) {
                sTSql = sTSql + obj.module.fieldByName(aFSourceSubKeyFields[i]).name + '；';
                _.ui.showWarnning(sTSql.substr(0, sTSql.length - 1) + ';' + sNotSelect + '!', function () {
                    iResult = 0;
                    _.ui.closeWatting();
                });

            }
        } else {
            for (var i = 0; i < oSQL.length; i++) {
                var key = '';
                for (var j in aFSourceSubKeyFields) {
                    var sFSourceSubKeyFieldName = obj.module.fieldByName(aFSourceSubKeyFields[j]).fieldName;
                    key += '|' + oSQL[i][sFSourceSubKeyFieldName];
                }
                for (var j in aFSourceSubKeyFields) {
                    var sFSourceSubKeyFieldName = obj.module.fieldByName(aFSourceSubKeyFields[j]).fieldName;
                    if (!aFSourceSubKeyValues[key])
                        aFSourceSubKeyValues[key] = [];
                    aFSourceSubKeyValues[key].push(oSQL[i][sFSourceSubKeyFieldName]);
                }
            }
            iResult = Object.getOwnPropertyNames(aFSourceSubKeyValues).length;
        }
        return iResult;
    };

    var fnGetRecordIDs = function (sRecordID, callback_fnGetRecordIDs) {
        try {
            var sSourceKeyFieldName = obj.module.fieldByName(sSourceKeyField).fieldName;
            var sSourceKeyTable = _.project.moduleByFieldName(sSourceKeyField).tableName;
            var oTxt = {
                "values": {
                    "sSourceKeyFieldName": sSourceKeyFieldName,
                    "sSourceKeyTable": sSourceKeyTable,
                    "sRecordID": sRecordID
                }
            }
            var oSQL = _.db.execute('VLIB_cxAutoData_fnGetRecordIDs_sSourceKeyFieldName', oTxt);
            sFSourceKeyValue = oSQL[0][sSourceKeyFieldName] ? oSQL[0][sSourceKeyFieldName] : '';
        } catch (err) {
            _.log.error('查找数据源主表条件字段出错！');
        }
        try {
            var sTargetKeyFieldName = _.project.modules.moduleByName(sTargetMouleName).fieldByName(sTargetKeyField).fieldName;
            var sTargetKeyTable = _.project.moduleByFieldName(sTargetKeyField).tableName;
            var oTxt = {
                "values": {
                    "sTargetKeyTable": sTargetKeyTable,
                    "sTargetKeyFieldName": sTargetKeyFieldName,
                    "sFSourceKeyValue": sFSourceKeyValue
                }
            }
            var oSQL = _.db.execute('VLIB_cxAutoData_fnGetRecordIDs_rid', oTxt);
            if (oSQL.length > 0) {
                callback_fnGetRecordIDs(oSQL[0].rid);
            } else {
                callback_fnGetRecordIDs('false');
            }
        } catch (err) {
            _.log.error('查找目标模块出错！');
        }
    };

    var fnInit = function (callback_fnInit) {
        //---获取目标模块需要删除的记录rid,res返回true表示待删除的记录已搜索完毕，可以执行删除操作
        fnGetDelRecordIDs(sSourceRecordID, function (res) {
            if (res) {
                //---确认目标模块数据已删除完毕，res返回true表示删除已执行完毕，可以执行自动数据操作
                fnDeleteRecord(_.project.moduleByFieldName(sTargetKeyField), function (res) {
                    if (res) {
                        _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>' + _.language.get('正在操作') + '[' + sTargetMouleName + ']!', function () {
                            if (sSourceSubKeyFields.length > 0) {
                                var iResult = fnGetSubKeyValue(sSourceRecordID);
                                if (iResult > 0) {
                                    iR_Count = iResult;
                                } else {
                                    return;
                                }
                            } else {
                                iR_Count = 1;
                            }
                            var keys = [];
                            for (var key in aFSourceSubKeyValues) {
                                keys.push(key);
                            }
                            var idx = 0;
                            var fnCreateForm = function () {
                                _.app.ui.createEditor({
                                    moduleName: sTargetMouleName,
                                    onInit: function (oEditor) {
                                        //---将当前模块子表条件字段赋值给目标模块主表条件对应字段
                                        idx++;
                                        var key = keys.pop(); //返回最后一个元素并删除
                                        var sourceval = aFSourceSubKeyValues[key];
                                        oEditor.recordSet.fieldByName(sTargetKeyField).val(sFSourceKeyValue);
                                        if (sTargetIDField) {
                                            //---若目标模块主键字段不为空，且当前子表条件数为1，则将当前模块子表条件字段赋值给目标模块主键字段，如'采购合同.采购合同'，否则编号后加'-1'流水号
                                            if (!bAutomatic) {
                                                if (iR_Count == 1) {
                                                    oEditor.recordSet.fieldByName(sTargetIDField).val(sFSourceKeyValue);
                                                } else {
                                                    oEditor.recordSet.fieldByName(sTargetIDField).val(sFSourceKeyValue + '-' + idx);
                                                }
                                            }
                                        }
                                        if (sTargetMainKeyFields.length > 0) {
                                            //---将当前子表条件字段数组分别赋值给目标模块主表条件对应字段
                                            for (var iSIndex in aFTargetMainKeyFields) {
                                                oEditor.recordSet.fieldByName(aFTargetMainKeyFields[iSIndex]).val(sourceval[iSIndex]);
                                            }
                                        }
                                        oEditor.save(false, function (res) {
                                            if (res) {
                                                delete res;
                                                if (keys.length == 0) {
                                                    _.ui.Message({
                                                        msg: _.language.get('自动数据操作成功！'),
                                                        center: "center", //居中
                                                        autoClose: true, //是否自动关闭
                                                        showClose: false, //是否显示关闭按钮
                                                        type: 2, //info: 1, success: 2, warning: 3, error: 4
                                                        closeTime: 8000 //自动关闭时间
                                                    });
                                                    //---发送提醒消息
                                                    fnGetRecordIDs(sSourceRecordID, function (res) {
                                                        if (bSendMSG && res != 'false') {
                                                            var aAllUserList = [];
                                                            var oSQL = _.db.execute('VLIB_cxSendInTimeMessage_userName', {});
                                                            for (var i in oSQL) {
                                                                aAllUserList.push(oSQL[i].UserName);
                                                            }
                                                            _.ui.showInput({
                                                                title: _.language.get('请选择要通知的人员:'),
                                                                type: "multidropdown",
                                                                value: "", //默认值
                                                                fields: aAllUserList,
                                                                onapprove: function (aNotify) {
                                                                    if (aNotify) {
                                                                        aMSGUserList = [aNotify];
                                                                        for (var k in aNotify) {
                                                                            _.app.im.sendModuleRecord(aNotify[k], sTargetMouleName + _.language.get('数据已经生成,请查看！'), sTargetMouleName, res); //调用IM链接记录
                                                                        }
                                                                    }
                                                                },
                                                                onHide: function () {
                                                                    callback_fnInit(true);
                                                                }
                                                            });
                                                        }
                                                    });
                                                    _.ui.closeWatting();
                                                    if (!bSendMSG) {
                                                        callback_fnInit(true);
                                                    }
                                                } else {
                                                    fnCreateForm();
                                                }
                                            }
                                        }, function (err) {
                                            console.log(err);
                                        });
                                    },
                                    onError: function (err) {
                                        _.ui.Message({
                                            msg: sTargetMouleName + _.language.get('操作失败！'),
                                            center: "center", //居中
                                            autoClose: true, //是否自动关闭
                                            showClose: false, //是否显示关闭按钮
                                            type: 3, //info: 1, success: 2, warning: 3, error: 4
                                            closeTime: 5000 //自动关闭时间
                                        });
                                        window.bAutoData = false;
                                    },
                                    async: true
                                });
                            }
                            fnCreateForm();
                        });
                    }
                });
            }
        });
    };

    var aDelRecordIDs = [];
    var aFSourceSubKeyValues = {};
    var iR_Count;
    var sFSourceKeyValue, sSMSRecordID;
    var oFSourceKeyField, oFTargetKeyField, oFSourceSubKeyField, oFTargetMainKeyField, oFTargetIDField;
    var sTargetMouleName = sTargetKeyField.substr(0, sTargetKeyField.indexOf('.')); //目标模块名
    var oModulePermission = _.app.permission.getModulePermission(sTargetMouleName);
    if (!oModulePermission.new) {
        _.ui.showWarnning(sTargetMouleName + _.language.get('您没有新建该模块的权限！'));
        window.bAutoData = false;
        return;
    }
    if (obj.module.fieldByName(sSourceKeyField)) {
        oFSourceKeyField = obj.module.fieldByName(sSourceKeyField); //---如'采购计划.采购计划'
    } else {
        return;
    }
    if (_.project.modules.moduleByName(sTargetMouleName).fieldByName(sTargetKeyField)) {
        oFTargetKeyField = _.project.modules.moduleByName(sTargetMouleName).fieldByName(sTargetKeyField); //---如'采购合同.采购计划'
    } else {
        return;
    }
    var aFSourceSubKeyFields = [];
    var aFTargetMainKeyFields = [];
    if (sSourceSubKeyFields) {
        //---获取当前模块子表条件对应字段，如'采购计划.采购明细.厂商编号;采购计划.采购明细.采购员'
        aFSourceSubKeyFields = sSourceSubKeyFields.split(';');
        for (var iCIndex in aFSourceSubKeyFields) {
            if (obj.module.fieldByName(aFSourceSubKeyFields[iCIndex])) {
                oFSourceSubKeyField = obj.module.fieldByName(aFSourceSubKeyFields[iCIndex]);
            } else {
                return;
            }
        }
    }

    //---获取目标模块主表条件对应字段，如采购合同的字段'厂商编号;采购员'
    if (sTargetMainKeyFields) {
        aFTargetMainKeyFields = sTargetMainKeyFields.split(';');
        //---当前子表条件字段数和目标模块主表条件字段数不一致当然是不允许存在的
        if (aFSourceSubKeyFields.length != aFTargetMainKeyFields.length) {
            _.ui.showError(_.language.get('所选条件字段与将要生成的目标字段未能一一对应'), function () {
                window.bAutoData = false;
                return;
            });

        }
        for (var iCIndex in aFTargetMainKeyFields) {
            if (_.project.modules.moduleByName(sTargetMouleName).fieldByName(aFTargetMainKeyFields[iCIndex])) {
                oFTargetMainKeyField = _.project.modules.moduleByName(sTargetMouleName).fieldByName(aFTargetMainKeyFields[iCIndex]);
            } else {
                return;
            }
        }
    }
    //---sTargetIDField为目标模块主键字段，如采购合同的字段'采购合同'
    if (sTargetIDField) {
        if (_.project.modules.moduleByName(sTargetMouleName).fieldByName(sTargetIDField)) {
            oFTargetIDField = _.project.modules.moduleByName(sTargetMouleName).fieldByName(sTargetIDField);
        } else {
            return;
        }
    }

    //---判断当前模块子表记录是否为空，否则不允许自动数据
    if (sSourceSubKeyFields.length > 0) {
        var aModuleList = sSourceSubKeyFields.split(';');
        var sModuleName = aModuleList[0].split('.')[0]; //数据源模块名，如“采购计划”
        var aModuleDetail = [];
        var aModuleTableNameDetail = [];
        var aModuleNameDetail = [];
        for (var k in aModuleList) {
            aModuleDetail.push(aModuleList[k].split('.')[1]); //获取子表表名，如“产品资料”
        }
        aModuleDetail = VLIB.dedupe(aModuleDetail);
        for (k in aModuleDetail) {
            var sDetailTableName = _.project.modules.moduleByName(sModuleName).groupByName(aModuleDetail[k]).tableName;
            aModuleTableNameDetail.push(sDetailTableName);
            aModuleNameDetail.push(aModuleDetail[k]);
        }
        var sDetailName = aModuleNameDetail.toString();
        fnSubExist(sSourceRecordID, aModuleTableNameDetail, function (res) {
            if (res == true) {
                fnInit(function (res) {
                    if (res == true) {
                        if (callback != undefined) {
                            callback(true);
                        }
                    }
                });
            } else {
                _.ui.showError(_.language.get('畅想软件自动生成:') + '[' + sDetailName + ']' + _.language.get('子表无数据，数据无法生成'));
                window.bAutoData = false;
                return;
            }
        });
    } else {
        fnInit(function (res) {
            if (res == true) {
                if (callback != undefined) {
                    callback(true);
                }
            }
        });
    }
};

//<------------------------单元集_希尔算法排序------------------------->
VLIB.cxShellSort = function (arr) {
    var gap = Math.floor(arr.length / 2);
    while (gap >= 1) {
        for (var i = gap; i < arr.length; i++) {
            var j, temp = arr[i];
            for (j = i - gap; j >= 0 && temp < arr[j]; j = j - gap) {
                arr[j + gap] = arr[j];
            }
            arr[j + gap] = temp;
        }
        gap = Math.floor(gap / 2);
    }
    return arr
};

//<------------------------单元集_记录状态------------------------->
VLIB.Status = function (self, sModuleName, sModuleTableName, sStatusKeyName, sStatusKeyFieldName, sStatusValue) {
    if (self.type == 'edit') {
        _.db.execute('VLIB_Status', {
            "values": {
                "sModule": sModuleTableName,
                "sField": sStatusKeyFieldName,
                "srids": '"' + self.rid + '"',
                "sSalesOrderStatus": sStatusValue
            }
        });
        var oModule = self.recordSet.tableByName(sModuleName).data;
        oModule[0][sStatusKeyFieldName] = sStatusValue;
        self.field(sModuleName + '.' + sStatusKeyName).setValue(sStatusValue);
    } else {
        var srids = '';
        var aRows = [];
        aRows = self.grid.getSelectedRows();
        if (aRows.length == 0) {
            aRows = [self.grid.rowID()];
        }
        for (var i in aRows) {
            self.grid.setCell(sStatusKeyName, sStatusValue, {}, aRows[i]);
            srids = srids + '"' + self.getID("rid", aRows[i]) + '",';
        }
        srids = srids.substr(0, srids.length - 1); //获取选中rid的字符串
        _.db.execute('VLIB_Status', {
            "values": {
                "sModule": sModuleTableName,
                "sField": sStatusKeyFieldName,
                "srids": srids,
                "sSalesOrderStatus": sStatusValue
            }
        });
    }
}

//<------------------------单元集_通用样式------------------------->
//恢复默认样式
VLIB.defultstyle = {
    "color": "",
    "background": "",
    //"font-weight": "normal",
    //"font-style": "normal"
}

VLIB.sucessStyle = {
    "color": "#67c23a",
    "font-weight": "bold"
}

VLIB.warningStyle = {
    "color": "#e6a23c",
    "font-weight": "bold"
}

VLIB.errorStyle = {
    "color": "#f56c6c",
    "font-weight": "bold"
}

VLIB.sucessFill = {
    "color": "#fff",
    "background": "#67c23a",
    "font-weight": "bold"
}

VLIB.warningFill = {
    "color": "#fff",
    "background": "#e6a23c",
    "font-weight": "bold"
}

VLIB.errorFill = {
    "color": "#fff",
    "background": "#f56c6c",
    "font-weight": "bold"
}
//渐变色
VLIB.Red0Fill = {
    "color": "#fff",
    "background": "#eb514c",
    "font-weight": "bold"
}
VLIB.Red20Fill = {
    "color": "#fff",
    "background": "#eb644c",
    "font-weight": "bold"
}
VLIB.Red40Fill = {
    "color": "#fff",
    "background": "#eb814c",
    "font-weight": "bold"
}
VLIB.Red60Fill = {
    "color": "#fff",
    "background": "#eb9d4c",
    "font-weight": "bold"
}
VLIB.Red80Fill = {
    "color": "#fff",
    "background": "#eb9a4c",
    "font-weight": "bold"
}
VLIB.Yellow100Fill = {
    "color": "#fff",
    "background": "#ebcc4c",
    "font-weight": "bold"
}

//---<登陆成功，存放系统全局变量>
var fnGetqConfig = function (callback) {
    if (!window.aconfig || !window.aconfig.PublicCustomers_PublicCheck) {
        var sUserID = _.app.cxUserInfo().recordID;
        _.net.get('/intersky/qConfig/read', {}, function (oData) {
            if (oData.data.PublicCustomers_PublicCheck == 0 || oData.data.PublicCustomers_PublicCheck == 1) {
                window.aconfig = oData.data;
            } else {
                window.aconfig = {
                    SystemConfig_MultistageMenu: true,
                    PublicCustomers_PublicCheck: true,
                    Quotations_PrintBeforeStartupCheck: false,
                    SalesOrders_PrintBeforeStartupCheck: false,
                    SalesOrder_ToPurWorkFlowCheck: false,
                    SalesOrder_ToDownPaymentCheck: false,
                    SalesOrder_UpdatePurchasePlansUserCheck: true,
                    SalesOrders_AutoNoCheck: false,
                    PurchasePlans_AutoNoCheck: false,
                    PurchaseOrders_PrintBeforeStartupCheck: false,
                    PurchaseOrders_NoNeedForApprovalDepositCheck: false,
                    ShipingPlans_DeclareType: "配件报关",
                    ShipingPlans_AllowSalesWorkflow: true,
                    Shipments_OverflowShortRatio: 5,
                    Shipments_SeaFreightCurrencyCoBx: 'USD',
                    Shipments_CustomsPriceCheck: false,
                    Incomes_ApportionmentCheck: false,
                    ExchangeRate_CheckBox: true,
                    SystemReminder_Check: [{
                        sUserID: sUserID,
                        bCheck: true
                    }]
                }
            }
            callback(window.aconfig);
        });
    } else {
        callback(window.aconfig);
    }
}

function evt_LOGIN(obj) {
    console.log('登陆成功！');
    window.intersky = {}; //设定window.intersky为全局变量

    //Q系配置
    fnGetqConfig(function (res) {
        window.aconfig = res;
    });

    //当前使用语言
    window.intersky["sLanguage"] = _.language.get('languages');

    //用户列表
    _.db.execute('VLIB_cxSendInTimeMessage_userName', {}, function (oSQL) {
        if (oSQL.length > 0) {
            var aAllUserList = [];
            for (var i in oSQL) {
                aAllUserList.push(oSQL[i].UserName);
            }
            window.intersky["aAllUserList"] = aAllUserList;
        }
    }, function (err) {
        _.log.error(err);
    }, false);

    //业务字典-结汇比
    _.db.execute('Dic_SettlementRate', {}, function (oSQL) {
        if (oSQL.length > 0) {
            var oData = {};
            for (var i in oSQL) {
                var sKey = (oSQL[i].Company).concat(oSQL[i].ExportRebatesRate);
                oData[sKey] = oSQL[i].SettlementRatio;
            }
            window.intersky["oDic_SettlementRate"] = oData;
        }
    }, function (err) {
        _.log.error(err);
    }, false);

    //业务字典-货币代码_汇率
    _.db.execute('Dic_Currency_Rate', {}, function (oSQL) {
        if (oSQL.length > 0) {
            var oData = {};
            for (var i in oSQL) {
                var sKey = oSQL[i].CurrencyCode;
                oData[sKey] = oSQL[i].Rate;
            }
            window.intersky["oDic_Currency_Rate"] = oData;
        }
    }, function (err) {
        _.log.error(err);
    }, false);

    //业务字典-计量单位_英文单复数
    _.db.execute('Dic_Unit_Singular_Plural', {}, function (oSQL) {
        if (oSQL.length > 0) {
            var oData = {};
            for (var i in oSQL) {
                var sKey = oSQL[i].Unit;
                var aValue = [];
                aValue.push(oSQL[i].ENGSingular);
                aValue.push(oSQL[i].ENGPlural);
                oData[sKey] = aValue;
            }
            window.intersky["oDic_Unit_Singular_Plural"] = oData;
        }
    }, function (err) {
        _.log.error(err);
    }, false);
}
addListener([EVT_LOGIN_SUCCEED], evt_LOGIN);

//---<界面加载完成>
function evt_DESKTOP(obj) {
    //根据Q系配置，隐藏客户公海
    fnGetqConfig(function (res) {
        window.aconfig = res;
        if (window.aconfig) {
            if (!window.aconfig.PublicCustomers_PublicCheck && obj.module('客户公海')) {
                obj.module('客户公海').hide();
            }

            if (!window.aconfig.ExchangeRate_CheckBox && obj.module('汇率管理')) {
                obj.module('汇率管理').hide();
            }
        }
    });

    //Q系账套版本号
    var iWidth = screen.width;
    var iHeight = screen.height;
    if (iWidth != 1920 || iHeight != 1080) {
        sMsg = "<br>" + _.language.get("建议使用1920*1080的分辨率，视觉效果最佳！");
    } else {
        sMsg = "";
    }
    _.ui.Notification({
        title: _.language.get('您已成功登陆Q8系统！'),
        msg: _.language.get('当前账套版本:') + '[V1.1.0]，' + _.language.get('平台版本：') + '[' + window.project_version + ']' + sMsg,
        showBtn: false, //是否显示按钮
        autoClose: true, //是否自动关闭
        closeTime: 10000 //自动关闭时间
    });
}
addListener([EVT_DESKTOP_CREATED], evt_DESKTOP);

//图片导入
var fnItems_UploadPhoto = function () {
    _.app.cxUploadPicture({
        header: '<span style="font-size:14px!important">' + _.language.get("上传图片(图片命名以产品编号+@+序号组成，如：ITM001@1,ITM002@2)") + '</span>',
        onApprove: function (aImages) {
            //aImages返回的是图片存储路径的数组，oImages是将图片路径数组转化成插入数据库图片字段的结构，如Update Items set photo=oImages...即可显示图片。
            _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>' + _.language.get('正在操作') + '!', function () {
                var oImages = {}; //存放图片路径的字典
                for (var i in aImages) {
                    var iIndex = aImages[i].indexOf('@'); //"@"为图片名称区别与产品编号的标识符，如“ITM001@1”表示第一张图片
                    var sValue;
                    if (iIndex > 0) {
                        sValue = aImages[i].substr(0, aImages[i].indexOf('@')).replace(/(.*\/)*([^.]+).*/ig, "$2"); //正则截取产品编号
                    } else {
                        sValue = aImages[i].replace(/(.*\/)*([^.]+).*/ig, "$2"); //正则截取产品编号
                    };
                    //将图片路径存入字典中
                    if (oImages.hasOwnProperty(sValue)) {
                        oImages[sValue].push(aImages[i]); //若字典中的key已存在，则追加到value的数组中
                    } else {
                        oImages[sValue] = [aImages[i]]; //若字典中的key不存在，则增加一个key value(键值对)
                    }
                };
                // 循环字典
                var aParams = []; //用于存放参数数组 
                var aItemNo = []; //存放产品编号数组
                for (var sKey in oImages) {
                    var oTxt = {
                        "values": {
                            "sItemNo": sKey
                        }
                    };
                    aItemNo.push(sKey);
                    aParams.push(oTxt);
                }
                var oSQL = _.db.execute('Items_Select_ItemNo', aParams);
                var aParams = []; //用于存放参数数组 
                for (var i in oSQL) {
                    if (oSQL[i].length > 0) {
                        var sItemNo = aItemNo[i];
                        var sImages = _.utils.imageFormatter(oImages[sItemNo]); //将图片路径封装成图片结构
                        var oTxt = {
                            "values": {
                                "sPhoto": sImages,
                                "sItemNo": sItemNo
                            }
                        };
                        aParams.push(oTxt);
                    }
                }
                _.db.execute('Items_Update_Photo', aParams);
                _.ui.closeWatting();
            });
        }
    });
}

//---<配置中心>
function evt_config(obj) {
    var self = obj.form;
    var sQSeriesConfig, sDevelopment, sImportData, sImportPictur
    //Q系配置
    switch (window.intersky.sLanguage) {
        case 'English':
            sQSeriesConfig = 'Configuration of Q series';
            sDevelopment = 'Development Directory';
            sImportData = 'Data import';
            sImportPictur = 'Picture import';
            break;
        case '繁体中文':
            sQSeriesConfig = 'Q系配置';
            sDevelopment = '開發目錄';
            sImportData = '數據導入';
            sImportPictur = '圖片導入';
            break;
        default:
            sQSeriesConfig = 'Q系配置';
            sDevelopment = '开发目录';
            sImportData = '数据导入';
            sImportPictur = '图片导入';
    }
    self.addConfigure("bQSeriesConfig", sQSeriesConfig, function () {
        _.app.ui.showCustomModal({
            'url': '/intersky/qConfig'
        });
    }, "paint brush icon");
    //开发目录
    self.addConfigure("bDevelopment", sDevelopment, function () {
        if (_.app.cxUserInfo().isAdmin) {
            _.ui.showWarnning(_.language.get('即将载入开发目录，请谨慎操作开发目录文件，删除则无法被恢复'), function () {
                _.app.ui.showCustomModal({
                    url: '/intersky/sever_filespath'
                });
            });
        } else {
            _.ui.showWarnning(_.language.get('操作失败！'));
        }
    }, "folder open icon");
    //数据导入
    self.addConfigure("bImportData", sImportData, function () {
        _.app.ui.showCustomModal({
            css: {
                overflow: "visible"
            },
            width: 400,
            height: 230,
            url: '/intersky/importData'
        });
    }, "cloud upload icon");
    //图片导入
    self.addConfigure("bImportPicture", sImportPictur, function () {
        fnItems_UploadPhoto();
    }, "camera icon");
}
addListener([EVT_CONFIGURE], evt_config);

//---<菜单关联自定义界面>
function evt_CustomizeMemu(obj) {
    var sModuleName = obj.name;
    switch (sModuleName) {
        case "Q系配置":
            if (!_.app.permission.checkExtendPermissionIsEnable('允许使用Q系配置')) {
                _.ui.showWarnning(_.language.get('您没有被授权该功能！'));
                return;
            }
            _.app.ui.showCustomModal({
                'url': '/intersky/qConfig'
            });
            break;
        case "数据导入":
            if (!_.app.permission.checkExtendPermissionIsEnable('允许使用数据导入')) {
                _.ui.showWarnning(_.language.get('您没有被授权该功能！'));
                return;
            }
            _.app.ui.showCustomModal({
                css: {
                    overflow: "visible"
                },
                width: 400,
                height: 230,
                url: '/intersky/importData'
            });
            break;
        default:
            if (!_.app.permission.checkExtendPermissionIsEnable('允许使用图片导入')) {
                _.ui.showWarnning(_.language.get('您没有被授权该功能！'));
                return;
            }
            fnItems_UploadPhoto();
    }
}
addListener([EVT_MENU_CUSTOMIZE_CLICK], evt_CustomizeMemu);