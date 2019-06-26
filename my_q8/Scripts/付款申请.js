//---<付款申请_自动生成付款数据> 
var fnForPayments_AutoPay = function (self) {
    var i = self.grid.rowID();
    var fUnPaiedAmount = self.grid.getCell("未付金额", i);
    var srid = self.grid.getCell("rid", i);
    var sApplyNo = self.grid.getCell("申请单号", i);
    var sPaymentType = self.grid.getCell("付款类别", i);
    var sModule = self.moduleName;
    if (fUnPaiedAmount > 0 && VLIB.cxCheckWorkflowState(sModule, srid) == 1) {
        switch (sPaymentType) {
            case "国外费用":
                _.app.ui.openEditor('new', '国外费用', '', function (oEditor) {
                    _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>' + _.language.get("正在导入数据，请等待！"), function () {
                        oEditor.recordSet.fieldByName('付款单号').val(sApplyNo);
                        _.ui.closeWatting();
                    });
                });
                break;
            case "国内费用":
                _.app.ui.openEditor('new', '国内费用', '', function (oEditor) {
                    _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>' + _.language.get("正在导入数据，请等待！"), function () {
                        oEditor.recordSet.fieldByName('付款单号').val(sApplyNo);
                        _.ui.closeWatting();
                    });
                });
                break;
            default:
                _.app.ui.openEditor('new', '工厂付款', '', function (oEditor) {
                    _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>' + _.language.get("正在导入数据，请等待！"), function () {
                        oEditor.recordSet.fieldByName('付款单号').val(sApplyNo);
                        _.ui.closeWatting();
                    });
                });
        }
    } else {
        _.ui.showWarnning(_.language.get("您选中的记录不符合付款要求！"));
    }
}

function btn_ForPayments(obj) {
    var self = obj.form;
    if (self.moduleName == '付款申请') {
        if (self.addButton) {
            self.addButton("bShipmentsAutoInspections", _.language.get("自动生成付款数据"), function () {
                fnForPayments_AutoPay(self);
            }, "share icon");
        }
    }
}
addListener([EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY, EVT_SEARCHFORM_CREATED], btn_ForPayments);

//---<付款申请_采购合同判断有无定金>
function evt_ApplyForPayments_BeforeSave(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == '付款申请') {
            if (self.recordSet.fieldByName('款项名称').val() == '定金') {
                var aPurchaseOrderNo = self.recordSet.fieldByName('费用明细.关联单号').getColValue();
                for (var i in aPurchaseOrderNo) {
                    var oTxt = {
                        "values": {
                            "sPurchaseOrderNo": aPurchaseOrderNo[i]
                        }
                    };
                    aParams.push(oTxt);
                }
                _.db.execute('ApplyForPayments_Update_PurchaseOrders', aParams);
            }
            resolve();
        } else {
            resolve();
        }
    });
}
addPromiseListener([EVT_RECORDSET_BEFORE_SAVE], evt_ApplyForPayments_BeforeSave);

//---<付款申请_默认加载数据>
var fnApplyForPayments_DefaltData = function (self) {
    if (!self.recordSet.fieldByName('财务审批').val()) {
        var oTxt = {
            "values": {}
        }
        var oSQL = _.db.execute('ApplyForPayments_Select_ApplyForPayments_', oTxt);
        if (oSQL.length > 0) {
            self.recordSet.fieldByName('财务审批').val(oSQL[0].AccountingApproval);
        }
    }
    var dUserInfo = _.app.cxUserInfo();
    if (!self.recordSet.fieldByName('申请人').val()) {
        self.recordSet.fieldByName('申请人').val(dUserInfo.userName);
    }
};

function evt_ForPayments_DefaltData(obj) {
    var self = obj.form;
    if (self.moduleName == '付款申请') {
        fnApplyForPayments_DefaltData(self);
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], evt_ForPayments_DefaltData);

//---<付款申请_款项名称>
var fnApplyForPayments_CostName = function (self) {
    var sCurrencyName;
    switch (self.recordSet.fieldByName('付款类别').val()) {
        case '工厂付款':
            var aDropItems = ['定金','货款','样品费','其它'];
            self.field('款项名称').clearDropMenu(); //清空
            self.field('款项名称').setDropMenu(aDropItems);
            sCurrencyName = '人民币';
            break;
        case '国内费用':
            var aDropItems = ['快件费','运杂费','其它'];
            self.field('款项名称').clearDropMenu();
            self.field('款项名称').setDropMenu(aDropItems);
            sCurrencyName = '人民币';
            break;
        case '国外费用':
            var aDropItems = ['佣金','海运费','保险费','其它'];
            self.field('款项名称').clearDropMenu();
            self.field('款项名称').setDropMenu(aDropItems);
            sCurrencyName = '美元';
            break;
    }
    if (!self.recordSet.fieldByName('货币代码').val()) {
        var oTxt = {
            "values": {
                "sCurrencyName": sCurrencyName
            }
        }
        var oSQL = _.db.execute('ApplyForPayments_Select_Dic_Currency', oTxt);
        if (oSQL.length > 0) {
            self.recordSet.fieldByName('货币代码').val(oSQL[0].CurrencyCode);
        }
    }
};

function evt_ForPayments_CostName(obj) {
    var self = obj.form;
    if (self.moduleName == '付款申请') {
        fnApplyForPayments_CostName(self);
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], evt_ForPayments_CostName);

function cge_RecordSet_ForPayments(obj) {
    var self = obj.form;
    var cgeField = obj.field;
    if (self.moduleName == '付款申请') {
        if (cgeField.fullName == '付款申请.款项名称') {
            fnApplyForPayments_DefaltData(self);
            if (self.recordSet.fieldByName('款项名称').val() == '货款') {
                self.field('费用明细.货款申请已完结').hide();
            }
        }

        //---<付款申请_款项名称>
        if (cgeField.fullName == '付款申请.付款类别') {
            fnApplyForPayments_CostName(self);
        }
    }
}
addListener([EVT_RECORDSET_AFTER_FIELD_CHANGED], cge_RecordSet_ForPayments);

//---<付款申请_记录复制>
function evt_ForPayments_aftercopy(obj) {
    var self = obj.form;
    if (self.moduleName == "付款申请") {
        self.recordSet.fieldByName('工厂付款').val(0);
        self.recordSet.fieldByName('国外费用').val(0);
        self.recordSet.fieldByName('国内费用').val(0);
    }
}
addListener([EVT_RECORDSET_AFTER_COPY], evt_ForPayments_aftercopy);

//---<付款申请_查询界面样式>
function evt_ForPayments_SearchDrawCell(obj) {
    var self = obj.form;
    if (self.moduleName == '付款申请') {
        // 审批通过且未付金额>0进行标记
        var fUnPaiedAmount;
        var oUnPaiedAmount = self.grid.getColumn('未付金额');
        var orid = self.grid.getColumn('rid');
        var sModule = self.moduleName;
        for (var i = 0; i < oUnPaiedAmount.length; i++) {
            fUnPaiedAmount = oUnPaiedAmount[i].value ? oUnPaiedAmount[i].value : 0;
            if (fUnPaiedAmount > 0) {
                if (VLIB.cxCheckWorkflowState(sModule, orid[i].value) == 1) {
                    self.grid.setRow({}, {
                        "color": "#fff",
                        "background": "#67c23a",
                        "font-weight": "bold"
                    }, i + 1);
                }
            }
        }
    }
}
addListener([EVT_SEARCHFORM_SEARCH_COMPLETE], evt_ForPayments_SearchDrawCell);