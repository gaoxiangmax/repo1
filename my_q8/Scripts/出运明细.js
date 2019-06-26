//---<出运明细_检查费用调用情况>
var fnInCost = function (self, aStr1, aStr2) {
    var sSQL = '';
    var alstStr1 = aStr1;
    var alstStr2 = aStr2;
    for (var i in alstStr1) {
        if (sSQL) {
            sSQL = sSQL + ' union all ';
        }
        sSQL = sSQL + 'Select SalesCostsDetail.CostsName,SalesCostsDetail.CostsAmount,SalesCostsDetail.Currency,' +
            'SalesCostsDetail.ExchangeRate,SalesCostsDetail.Costs,SalesCostsDetail.Remark From SalesOrders,SalesCostsDetail' +
            ' where SalesOrders.rid=SalesCostsDetail.pid and SalesOrderNo="' + alstStr1[i] + '"';
    }
    for (var i in alstStr2) {
        if (sSQL) {
            sSQL = sSQL + ' union all ';
        }
        sSQL = sSQL + 'Select PurchaseCostsDetail.CostsName,PurchaseCostsDetail.CostsAmount,PurchaseCostsDetail.Currency,' +
            'PurchaseCostsDetail.ExchangeRate,PurchaseCostsDetail.Costs,PurchaseCostsDetail.Remark From PurchaseOrders,PurchaseCostsDetail' +
            ' where PurchaseOrders.rid=PurchaseCostsDetail.pid and PurchaseOrderNo="' + alstStr2[i] + '"';
    }
    var oSQL = _.db.execute('Shipments_Select_yj', {
        "values": {
            "sSQL": sSQL
        }
    });
    if (oSQL.length == 0) {
        _.ui.showWarnning(_.language.get('没有需要调入的数据！'));
    } else {
        self.recordSet.tableByName('客户相关费用').clear();
        for (var i in oSQL) {
            self.recordSet.tableByName('客户相关费用').append();
            self.recordSet.fieldByName('客户相关费用.费用名称').val(oSQL[i].CostsName);
            self.recordSet.fieldByName('客户相关费用.币种').val(oSQL[i].Currency);
            self.recordSet.fieldByName('客户相关费用.汇率').val(oSQL[i].ExchangeRate);
            self.recordSet.fieldByName('客户相关费用.费用').val(oSQL[i].Costs);
            self.recordSet.fieldByName('客户相关费用.金额').val(oSQL[i].CostsAmount);
            self.recordSet.fieldByName('客户相关费用.备注').val(oSQL[i].Remark);
        }
    }
};

//---<出运明细_新建利润核算>
var fnShipments_ProfitAccounting = function (self) {
    try {
        var sModuleName = '利润核算';
        var oModulePermission = _.app.permission.getModulePermission(sModuleName);
        if (!oModulePermission.new) {
            _.ui.showWarnning(sModuleName + _.language.get('您没有新建该模块的权限！'));
            return;
        }
        sKeyNo = self.recordSet.fieldByName('发票号码').val();
        var oTxt = {
            "values": {
                "sKeyNo": sKeyNo
            }
        }
        var oSQL = _.db.execute('Shipments_Select_ProfitAccounting', oTxt);
        if (oSQL.length > 0) {
            _.ui.showInfo(_.language.get('该出运明细已经做过核算，系统中止操作！'), 'Warnning');
            return;
        }
        _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>' + _.language.get('正在操作') + '！', function () {
            _.app.ui.createEditor({
                moduleName: "利润核算",
                onInit: function (oEditor) {
                    oEditor.recordSet.fieldByName('核算类别').val('出运核算');
                    oEditor.recordSet.fieldByName('单据号码').val(sKeyNo);
                    oEditor.save(false, function (oRecord) {
                        if (oRecord) {
                            _.app.ui.openEditor('edit', '利润核算', oRecord.recordSet.fieldByName('rid').val());
                            _.ui.closeWatting();
                        }
                    });
                },
                onError: function (err) {
                    if (err) {
                        _.log.error('保存失败！');
                    }
                },
                async: true
            });
        });
    } catch (err) {
        _.log.error('新建利润核算发生错误！');
    }
};

//---<出运明细_自动生成商检单据>
var fnShipments_AutoInspections = function (self) {
    if (self.modified) {
        _.ui.showWarnning(_.language.get('记录未保存，系统停止操作！'));
        return;
    }
    var srid;
    if (self.type == 'search') {
        srid = self.rid;
    } else {
        srid = self.recordSet.fieldByName('rid').val();
    }
    var oTxt = {
        "values": {
            "srid": srid
        }
    }
    var oSQL = _.db.execute('Shipments_Select_ShipmentsDelivery', oTxt);
    if (oSQL.length > 0) {
        VLIB.cxAutoData(self, srid, '出运明细.发票号码', '商检单据.发票号码', '出运明细.采购明细.厂商编号', '商检单据.厂商编号', '商检单据.商检发票号码', false);
    } else {
        _.ui.showWarnning(_.language.get('请在[产品资料]右键分解、并确认[采购明细]信息后操作！'));
    }
};

//---<出运明细_自动生成报关单据>
var fnShipments_AutoDeclarations = function (self) {
    var aRecordIDList = [];
    var sInvoiceNO;
    var srid;
    var sTargetMouleName = '报关单据';
    var oModulePermission = _.app.permission.getModulePermission(sTargetMouleName);
    if (!oModulePermission.new) {
        _.ui.showWarnning(_.language.get('您没有新建该模块的权限！'));
        return;
    }
    if (self.type == 'search') {
        srid = self.rid;
    } else {
        srid = self.recordSet.fieldByName('rid').val();
    }
    //---取当前记录的发票号码
    var oTxt = {
        "values": {
            "srid": srid
        }
    }
    var oSQL = _.db.execute('Shipments_Select_Shipments', oTxt);
    if (oSQL.length == 0) {
        return;
    } else {
        sInvoiceNO = oSQL[0].InvoiceNO;
    }

    //---判定[采购明细]是否有需商检的产品，若有则提醒用户是否走商检通道。
    var oTxt = {
        "values": {
            "srid": srid
        }
    }
    var oSQL = _.db.execute('Shipments_Select_Shipments_ShipmentsDelivery', oTxt);
    if (oSQL.length > 0) {
        _.ui.showWarnning(_.language.get('系统检测到该票[出运明细]有需商检的产品，建议走商检通道至报关单据！请[扩展]-[自动生成商检单据]-[自动生成报关单据]完成流程！'));
        return;
    }
    //---判定[采购明细]是否为无数据状态即做往下流程的自动数据动作。
    var oTxt = {
        "values": {
            "srid": srid
        }
    }
    var oSQL = _.db.execute('Shipments_Select_ShipmentsDelivery', oTxt);
    if (oSQL.length > 0) {
        var oTxt = {
            "values": {
                "sInvoiceNO": sInvoiceNO
            }
        }
        var oSQL2 = _.db.execute('Shipments_Select_Declarations', oTxt);
        if (oSQL2.length > 0) {
            _.ui.yesOrNo(
                _.language.get('系统检测报关单据已生成，是否删除，重新生成！'),
                okfunc = function () {
                    for (var i in oSQL2) {
                        aRecordIDList.push(oSQL2[i].rid);
                    }
                    try {
                        _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>' + _.language.get('正在操作') + '！', function () {
                            //---删除相应的报关单据。
                            for (var i in aRecordIDList) {
                                _.app.db.deleteModuleRecord('报关单据', aRecordIDList[i]);
                            }
                            _.ui.closeWatting();
                        });
                    } catch (err) {
                        _.ui.closeWatting();
                        _.ui.showError(_.language.get('操作失败！'));
                    }
                    //---执行[报关单据]新建动作。
                    _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>' + _.language.get('正在操作') + '！', function () {

                        _.app.ui.createEditor({
                            moduleName: "报关单据",
                            onInit: function (oEditor) {
                                oEditor.recordSet.fieldByName('发票号码').val(sInvoiceNO);
                                oEditor.recordSet.fieldByName('数据来源').val('出运明细');
                                oEditor.save(false, function (oRecord) {
                                    if (oRecord) {
                                        _.app.ui.openEditor('edit', '报关单据', oRecord.recordSet.fieldByName('rid').val());
                                        _.ui.closeWatting();
                                    }
                                });
                            },
                            onError: function (err) {
                                if (err) {
                                    _.log.error('保存失败！');
                                }
                            },
                            async: true
                        });
                    });

                },
                cancelfunc = function () {
                    _.ui.showError(_.language.get('您已经取消了操作!'));
                    isCancel = true;
                }
            );
        } else {
            //---执行[报关单据]新建动作。
            _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>' + _.language.get('正在操作') + '！', function () {
                _.app.ui.createEditor({
                    moduleName: "报关单据",
                    onInit: function (oEditor) {
                        oEditor.recordSet.fieldByName('发票号码').val(sInvoiceNO);
                        oEditor.recordSet.fieldByName('数据来源').val('出运明细');
                        oEditor.save(false, function (oRecord) {
                            if (oRecord) {
                                _.app.ui.openEditor('edit', '报关单据', oRecord.recordSet.fieldByName('rid').val());
                                _.ui.closeWatting();
                            }
                        });
                    },
                    onError: function (err) {
                        if (err) {
                            _.log.error('保存失败！');
                        }
                    },
                    async: true
                });
            });
        }
    } else {
        _.ui.showWarnning(_.language.get('请在[产品资料]右键分解、并确认[采购明细]信息后操作！'));
    }
};

//---<出运明细_自动生成结汇单据>
var fnShipments_AutoSettlementDocuments = function (self) {
    if (self.modified) {
        _.ui.showWarnning(_.language.get('记录未保存，系统停止操作！'));
        return;
    }
    var srid;
    if (self.type == 'search') {
        srid = self.rid;
    } else {
        srid = self.recordSet.fieldByName('rid').val();
    }
    VLIB.cxAutoData(self, srid, '出运明细.发票号码', '结汇单据.发票号码', '', '', '', false);
};

//---<出运明细_自动生成开票通知>
var fnShipments_AutoBillNotifies = function (self) {
    if (self.modified) {
        _.ui.showWarnning(_.language.get('记录未保存，系统停止操作！'));
        return;
    }
    var srid;
    if (self.type == 'search') {
        srid = self.rid;
    } else {
        srid = self.recordSet.fieldByName('rid').val();
    }
    var oTxt = {
        "values": {
            "srid": srid
        }
    }
    var oSQL = _.db.execute('Shipments_Select_ShipmentsDelivery', oTxt);
    if (oSQL.length > 0) {
        VLIB.cxAutoData(self, srid, '出运明细.发票号码', '开票通知.发票号码', '出运明细.采购明细.厂商编号', '开票通知.厂商编号', '开票通知.开票编号', false);
    } else {
        _.ui.showWarnning(_.language.get('请在[产品资料]右键分解、并确认[采购明细]信息后操作！'));
    }
};

//---<出运明细_自动生成结算中心>
var fnShipments_AutoSettlements = function (self) {
    if (self.modified) {
        _.ui.showWarnning(_.language.get('记录未保存，系统停止操作！'));
        return;
    }
    var srid, sInvoiceNO, sShipmentStatus;
    var fExchangeRate = 0;
    if (self.type == 'search') {
        srid = self.rid;
        fExchangeRate = _.convert.toFloat(self.grid.getCell('汇率', self.grid.rowID()))
    } else {
        srid = self.recordSet.fieldByName('rid').val();
        fExchangeRate = self.recordSet.fieldByName('汇率').val();
    }
    var oTxt = {
        "values": {
            "srid": srid
        }
    }
    var oSQL = _.db.execute('Shipments_Select_Shipments2', oTxt);
    if (oSQL.length > 0) {
        sInvoiceNO = oSQL[0].InvoiceNO;
        sShipmentStatus = oSQL[0].ShipmentStatus;
    }
    if (sShipmentStatus == '已出货' || sShipmentStatus == '提单确认' || sShipmentStatus == '收缴提单发票') {
        var oTxt = {
            "values": {
                "sInvoiceNO": sInvoiceNO
            }
        }
        var oSQL = _.db.execute('Shipments_Select_Settlements', oTxt);
        if (oSQL.length == 0) {
            var oSQL2 = _.db.execute('Shipments_Select_ShipmentsDelivery', {
                "values": {
                    "srid": srid
                }
            });
            if (oSQL2.length > 0) {
                if (fExchangeRate > 0) {
                    VLIB.cxAutoData(self, srid, '出运明细.发票号码', '结算中心.发票号码', '', '', '', false);
                } else {
                    _.ui.showWarnning(_.language.get('未设置币种对应汇率，系统中止操作！'));
                }
            } else {
                _.ui.showWarnning(_.language.get('请在[产品资料]右键分解、并确认[采购明细]信息后操作！'));
            }
        } else {
            _.ui.showWarnning(_.language.get('该票结算中心的记录已存在，操作中止！若有关键数据修改，请与相关财务联系！'));
        }
    } else {
        _.ui.showWarnning(_.language.get('当前出运状态不符合生成结算中心条件，操作中止！'));
    }
};

//---<出运明细_重新计算退税额>
var fnShipments_ReAmount = function (self) {
    var oSQL = _.db.execute('Shipments_Select_Customers', {
        "values": {
            "sCustomerNo": self.recordSet.fieldByName('客户编号').val()
        }
    });
    if (oSQL.length > 0) {
        VLIB.cxPurchTotal(self, '采购明细', _.convert.toBoolean(oSQL[0].IsEXW));
    } else {
        VLIB.cxPurchTotal(self, '采购明细');
    }
};

//---<出运明细_调入采购明细>
var fnShipments_ShipmentsDelivery = function (self) {
    var aSOL_RecordIDs = [];
    var aShippingTotalValues = [];
    var aItemNoSRcdList1 = [];
    var aItemNoSRcdList2 = [];
    var aRetList = [];
    var aShippingQtys = [];
    var bShipmentsCustomsPrice;
    var oTable = self.recordSet.tableByName('产品资料');
    var oTable1 = self.recordSet.tableByName('采购明细');
    oTable1.clear();
    var sDeclareType = self.recordSet.fieldByName('报关方式').val();
    var sDeclarationType;
    if (window.aconfig) {
        bShipmentsCustomsPrice = window.aconfig.Shipments_CustomsPriceCheck;
    } else {
        bShipmentsCustomsPrice = false;
    }
    _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>' + _.language.get('正在操作') + '！', function () {
        //----------------------调入采购明细-------------------------
        var fnFoldSheet = function () {
            var sSOL_RecordID = self.recordSet.fieldByName('产品资料.产品标识').val();
            var fShippingTotalValue = 0;
            try {
                var oSQL = _.db.execute('Shipments_Select_PurchaseOrders_PurchaseOrdersLine', {
                    "values": {
                        "sSalesOrderNo": self.recordSet.fieldByName('产品资料.销售合同').val(),
                        "sSOL_RecordID": sSOL_RecordID
                    }
                });
                for (var i in oSQL) {
                    oTable1.append();
                    self.recordSet.fieldByName('采购明细.对应产品').val(oSQL[i].ItemNoSource);
                    self.recordSet.fieldByName('采购明细.产品编号').val(oSQL[i].ItemNo);
                    self.recordSet.fieldByName('采购明细.客户货号').val(self.recordSet.fieldByName('产品资料.客户货号').val());
                    self.recordSet.fieldByName('采购明细.产品条码').val(oSQL[i].Barcode);
                    if (sDeclareType == '配件报关') {
                        sDeclarationType = self.recordSet.fieldByName('产品资料.计价方式').val();
                        self.recordSet.fieldByName('采购明细.海关编码').val(self.recordSet.fieldByName('产品资料.海关编码').val());
                        self.recordSet.fieldByName('采购明细.商检标志').val(self.recordSet.fieldByName('产品资料.商检标志').val());
                        self.recordSet.fieldByName('采购明细.申报要素').val(self.recordSet.fieldByName('产品资料.申报要素').val());
                        self.recordSet.fieldByName('采购明细.退税率').val(self.recordSet.fieldByName('产品资料.退税率').val());
                        self.recordSet.fieldByName('采购明细.增值税率').val(self.recordSet.fieldByName('产品资料.增值税率').val());
                        self.recordSet.fieldByName('采购明细.计价方式').val(sDeclarationType);
                        self.recordSet.fieldByName('采购明细.报关中文品名').val(self.recordSet.fieldByName('产品资料.报关中文品名').val());
                        self.recordSet.fieldByName('采购明细.报关英文品名').val(self.recordSet.fieldByName('产品资料.报关英文品名').val());
                        self.recordSet.fieldByName('采购明细.报关单位').val(self.recordSet.fieldByName('产品资料.报关单位').val());
                    } else {
                        var oSQL2 = _.db.execute('Shipments_Select_Items', {
                            "values": {
                                "sItemNo": oSQL[i].ItemNo
                            }
                        });
                        sDeclarationType = oSQL2[0].DeclarationType;
                        self.recordSet.fieldByName('采购明细.海关编码').val(oSQL2[0].HSCode);
                        self.recordSet.fieldByName('采购明细.商检标志').val(oSQL2[0].InspectionMark);
                        self.recordSet.fieldByName('采购明细.申报要素').val(oSQL2[0].DeclarationElements);
                        self.recordSet.fieldByName('采购明细.退税率').val(oSQL2[0].Rebate);
                        self.recordSet.fieldByName('采购明细.增值税率').val(oSQL2[0].VAT);
                        self.recordSet.fieldByName('采购明细.计价方式').val(sDeclarationType);
                        self.recordSet.fieldByName('采购明细.报关中文品名').val(oSQL2[0].CustomsCHNName);
                        self.recordSet.fieldByName('采购明细.报关英文品名').val(oSQL2[0].CustomsENGName);
                        self.recordSet.fieldByName('采购明细.报关单位').val(oSQL2[0].DeclareUnit);
                        self.recordSet.fieldByName("采购明细.外箱装量").val(self.recordSet.fieldByName('产品资料.外箱装量').val());
                        self.recordSet.fieldByName("采购明细.外箱单位").val(self.recordSet.fieldByName('产品资料.外箱单位').val());
                        self.recordSet.fieldByName("采购明细.外箱长度").val(self.recordSet.fieldByName('产品资料.外箱长度').val());
                        self.recordSet.fieldByName("采购明细.外箱宽度").val(self.recordSet.fieldByName('产品资料.外箱宽度').val());
                        self.recordSet.fieldByName("采购明细.外箱高度").val(self.recordSet.fieldByName('产品资料.外箱高度').val());
                        self.recordSet.fieldByName("采购明细.外箱毛重").val(self.recordSet.fieldByName('产品资料.外箱毛重').val());
                        self.recordSet.fieldByName("采购明细.外箱净重").val(self.recordSet.fieldByName('产品资料.外箱净重').val());
                    }
                    if (sDeclarationType == '重量') {
                        aShippingQtys.push(self.recordSet.fieldByName('产品资料.总净重').val());
                        self.recordSet.fieldByName('采购明细.开票单位').val('KGS');
                    } else {
                        aShippingQtys.push(self.recordSet.fieldByName('产品资料.出货数量').val());
                        self.recordSet.fieldByName('采购明细.开票单位').val(self.recordSet.fieldByName('产品资料.计量单位').val());
                    }
                    aSOL_RecordIDs.push(sSOL_RecordID);
                    self.recordSet.fieldByName('采购明细.销售单价').val(self.recordSet.fieldByName('产品资料.销售单价').val());

                    //bShipmentsCustomsPrice为true时，报关价从产品资料调入
                    if (bShipmentsCustomsPrice) {
                        self.recordSet.fieldByName('采购明细.报关单价').val(self.recordSet.fieldByName('产品资料.报关单价').val());
                        self.recordSet.fieldByName('采购明细.报关总价').val(self.recordSet.fieldByName('产品资料.报关总价').val());
                    } else {
                        if (oSQL[i].ItemNoSource == oSQL[i].ItemNo) {
                            self.recordSet.fieldByName('采购明细.报关单价').val(self.recordSet.fieldByName('产品资料.报关单价').val());
                            self.recordSet.fieldByName('采购明细.报关总价').val(self.recordSet.fieldByName('产品资料.报关总价').val());
                        } else {
                            self.recordSet.fieldByName('采购明细.报关单价').val(0);
                            self.recordSet.fieldByName('采购明细.报关总价').val(0);
                        }
                    }
                    self.recordSet.fieldByName('采购明细.采购合同').val(oSQL[i].PurchaseOrderNo);
                    self.recordSet.fieldByName('采购明细.产品组成').val(oSQL[i].ItemConstruction);
                    self.recordSet.fieldByName('采购明细.产品标识').val(sSOL_RecordID);
                    self.recordSet.fieldByName('采购明细.组成用量').val(oSQL[i].ComposeQty);
                    self.recordSet.fieldByName('采购明细.出货数量').val(_.convert.toFloat(self.recordSet.fieldByName('产品资料.出货数量').val() * _.convert.toFloat(oSQL[i].ComposeQty), 2));

                    if (oSQL[i].ItemNoSource == oSQL[i].ItemNo) {
                        self.recordSet.fieldByName('采购明细.厂商编号').val(oSQL[i].SupplierNo);
                        self.recordSet.fieldByName('采购明细.厂商简称').val(oSQL[i].SupplierShortName);
                    }
                    if (self.recordSet.fieldByName('采购明细.是否报关').val()) {
                        fShippingTotalValue = fShippingTotalValue + self.recordSet.fieldByName('采购明细.采购总价').val();
                    }
                }
                for (var i in oSQL) {
                    aShippingTotalValues.push(fShippingTotalValue);
                }
            } catch (err) {
                _.log.error(err.message);
            }
        };

        oTable.disableControl();
        var iBookMark = oTable.cursor();
        oTable.cursor(0, false);
        try {
            oTable.down(function () {
                fnFoldSheet();
            });
        } finally {
            oTable.cursor(iBookMark, true);
            oTable.enableControl('Batch_Shipments');
        }
        //----------------------调入采购明细-------------------------
        //----------------------开票数量计算-------------------------
        oTable1.disableControl();
        var iBookMark = oTable1.cursor();
        oTable1.cursor(0, false);
        try {
            oTable1.down(function () {
                if (sDeclareType != '配件报关') {
                    if (self.recordSet.fieldByName('采购明细.是否报关').val()) {
                        //报关+开票
                        iSOLRIDIndex = aSOL_RecordIDs.indexOf(self.recordSet.fieldByName('采购明细.产品标识').val());
                        if (_.convert.toFloat(aShippingTotalValues[iSOLRIDIndex]) > 0) {
                            self.recordSet.fieldByName('采购明细.开票数量').val((_.convert.toFloat(aShippingQtys[iSOLRIDIndex]) * self.recordSet.fieldByName('采购明细.采购总价').val() / _.convert.toFloat(aShippingTotalValues[iSOLRIDIndex])).toFixed(2));
                        } else {
                            -
                            self.recordSet.fieldByName('采购明细.开票数量').val(0);
                        }
                    } else if (!self.recordSet.fieldByName('采购明细.是否报关').val() && self.recordSet.fieldByName('采购明细.是否开票').val()) {
                        //不报关+开票
                        self.recordSet.fieldByName('采购明细.开票数量').val(self.recordSet.fieldByName('采购明细.出货数量').val());
                    } else {
                        //不报关+不开票
                        self.recordSet.fieldByName('采购明细.开票数量').val(0);
                    }
                } else {
                    if (self.recordSet.fieldByName('采购明细.计价方式').val() == '数量') {
                        self.recordSet.fieldByName('采购明细.开票数量').val(self.recordSet.fieldByName('采购明细.出货数量').val());
                    } else {
                        self.recordSet.fieldByName('采购明细.开票数量').val(self.recordSet.fieldByName('采购明细.总净重').val());
                    }
                }

            });
        } finally {
            oTable1.cursor(iBookMark, true);
            oTable1.enableControl('Batch_Shipments2');
        }
        //----------------------开票数量计算-------------------------
        var sSaleOrders = VLIB.dedupe(self.recordSet.fieldByName("产品资料.销售合同").getColValue()).join(';');
        var sCustomerContractNos = VLIB.dedupe(self.recordSet.fieldByName("产品资料.客户合同").getColValue()).join(';');
        self.recordSet.fieldByName("销售合同").val(sSaleOrders);
        self.recordSet.fieldByName("客户合同").val(sCustomerContractNos);

        //---开始分析采购产品是否存在同一产品分多家工厂下单的情况，以便调取出货数量数据
        var sItemNoSRcd = '';
        oTable1.disableControl();
        var iBookMark = oTable1.cursor();
        oTable1.cursor(0, false);
        try {
            oTable1.down(function () {
                sItemNoSRcd = self.recordSet.fieldByName('采购明细.产品编号').val() + self.recordSet.fieldByName('采购明细.产品标识').val();
                if (aItemNoSRcdList1.indexOf(sItemNoSRcd) < 0) {
                    aItemNoSRcdList1.push(sItemNoSRcd);
                } else {
                    aItemNoSRcdList2.push(sItemNoSRcd); //存同一产品分多工厂下单的标识条件
                }

            });
        } finally {
            oTable1.cursor(iBookMark, true);
            oTable1.enableControl('Batch_Shipments3');
        }

        aItemNoSRcdList1 = []; //清空用于存同一产品分多工厂下单的记录
        sItemNoSRcd = '';
        oTable1.disableControl();
        var iBookMark = oTable1.cursor();
        oTable1.cursor(0, false);
        try {
            oTable1.down(function () {
                sItemNoSRcd = self.recordSet.fieldByName('采购明细.产品编号').val() + self.recordSet.fieldByName('采购明细.产品标识').val();
                if (aItemNoSRcdList2.indexOf(sItemNoSRcd) >= 0) {
                    aItemNoSRcdList1.push(self.recordSet.fieldByName('采购明细.采购合同').val() + ';' + self.recordSet.fieldByName('采购明细.厂商编号').val() + ';' +
                        self.recordSet.fieldByName('采购明细.产品标识').val() + ';' + self.recordSet.fieldByName('采购明细.rid').val());
                }

            });
        } finally {
            oTable1.cursor(iBookMark, true);
            oTable1.enableControl('Batch_Shipments4');
        }

        if (aItemNoSRcdList1.length > 0) {
            var aParams = []; //用于存放参数数组
            var arids = [];
            for (var i in aItemNoSRcdList1) {
                aRetList = aItemNoSRcdList1[i].split(';');
                arids.push(aRetList[3]);
                var oTxt = {
                    "values": {
                        "sPurchaseOrderNo": aRetList[0],
                        "sSupplierNo": aRetList[1],
                        "sSOL_RecordID": aRetList[2]
                    }
                };
                aParams.push(oTxt);
            }

            var oSQL = _.db.execute('Shipments_Select_PurchaseOrders_PurchaseOrdersLine2', aParams);
            for (var i in arids) {
                //子表快速定位
                oTable1.locate('采购明细.rid', arids[i], true, true, function (iIdx) {
                    oTable1.cursor(iIdx, true);
                    self.recordSet.fieldByName('采购明细.出货数量').val(oSQL[i].OrderQty);
                });
            }
        }
        //采购合计及退税计算
        var oSQL = _.db.execute('Shipments_Select_Customers2', {
            "values": {
                "sCustomerNo": self.recordSet.fieldByName('客户编号').val()
            }
        });
        if (oSQL.length > 0) {
            VLIB.cxPurchTotal(self, '采购明细', _.convert.toBoolean(oSQL[0].IsEXW));
        } else {
            VLIB.cxPurchTotal(self, '采购明细');
        }
        _.ui.closeWatting();
    });
};

//---<出运明细_按照计价方式算报关总价>
var fnShipments_ClearancePrice = function (self) {
    var oTable = self.recordSet.tableByName('采购明细');
    oTable.disableControl(); //禁用子表对象，提高游标循环效率
    var iBookMark = oTable.cursor(); //获取当前焦点记录游标
    oTable.cursor(0, false);
    try {
        oTable.down(function () {
            if (self.recordSet.fieldByName('采购明细.计价方式').val() == '重量') {
                if (self.recordSet.fieldByName('采购明细.计价方式').val() != 0) {
                    self.recordSet.fieldByName('采购明细.报关总价').val((self.recordSet.fieldByName('采购明细.销售总价').val()).toFixed(2));
                    self.recordSet.fieldByName('采购明细.报关单价').val((self.recordSet.fieldByName('采购明细.销售总价').val() / self.recordSet.fieldByName('采购明细.总净重').val()).toFixed(2));
                }
            } else {
                self.recordSet.fieldByName('采购明细.报关总价').val((self.recordSet.fieldByName('采购明细.报关单价').val() * self.recordSet.fieldByName('采购明细.开票数量').val()).toFixed(2));
            }

        });
    } finally {
        oTable.cursor(iBookMark, true); //回滚至初始焦点记录
        oTable.enableControl('Batch_Shipments5'); //释放子表对象
    }
};

//---<出运明细_清空采购明细>
var fnShipments_ClearShipmentsDelivery = function (self) {
    self.recordSet.tableByName("采购明细").clear();
};

function btn_Shipments(obj) {
    var self = obj.form;
    if (self.moduleName == '出运明细') {
        if (self.addButton) {
            self.addButton("bExtend", _.language.get("扩展"), "", "yelp", true); //下拉菜单
            self.button('bExtend').addButton("bShipmentsAutoInspections", _.language.get("自动生成商检单据"), function () {
                fnShipments_AutoInspections(self);
            });
            self.button('bExtend').addButton("bShipmentsAutoSettlementDocuments", _.language.get("自动生成结汇单据"), function () {
                fnShipments_AutoSettlementDocuments(self);
            });
            self.button('bExtend').addButton("bShipmentsAutoBillNotifies", _.language.get("自动生成开票通知"), function () {
                fnShipments_AutoBillNotifies(self);
            });
            self.button('bExtend').addButton("bShipmentsAutoSettlements", _.language.get("自动生成结算中心"), function () {
                fnShipments_AutoSettlements(self);
            });


            if (self.type == 'edit') {
                self.button('bExtend').addButton("bShipmentsAutoDeclarations", _.language.get("自动生成报关单据"), function () {
                    fnShipments_AutoDeclarations(self);
                });
                self.button('bExtend').addButton("bShipments_ProfitAccounting", _.language.get("新建利润核算"), function () {
                    fnShipments_ProfitAccounting(self);
                });
                self.button('bExtend').addButton("bShipments_ReAmount", _.language.get("重新计算退税额"), function () {
                    fnShipments_ReAmount(self);
                });
                self.area('产品资料').addButton("bItemsExtend", _.language.get("扩展"), "", "yelp", true); //下拉菜单
                self.area('产品资料').button('bItemsExtend').addButton("bShipments_ShipmentsDelivery", _.language.get("调入采购明细"), function () {
                    fnShipments_ShipmentsDelivery(self);
                });
                self.area('采购明细').addButton("bDeliveryExtend", _.language.get("扩展"), "", "yelp", true); //下拉菜单 
                self.area('采购明细').button('bDeliveryExtend').addButton("bShipments_ClearancePrice", _.language.get("按照计价方式算报关总价"), function () {
                    fnShipments_ClearancePrice(self);
                });
                self.area('采购明细').button('bDeliveryExtend').addButton("bShipments_ClearShipmentsDelivery", _.language.get("清空采购明细"), function () {
                    fnShipments_ClearShipmentsDelivery(self);
                });
                self.area('客户相关费用').addButton("bPayExtend", _.language.get("扩展"), "", "yelp", true, true); //下拉菜单
                self.area('客户相关费用').button('bPayExtend').addButton("bShipingPlans_ReCosts", _.language.get("重新调入费用明细"), function () {
                    if (!self.recordSet.fieldByName('销售合同').val() || !self.recordSet.fieldByName('采购合同').val()) {
                        _.ui.showWarnning(_.language.get('系统无法获取“销售合同”或“采购合同”字段，请检查并保存记录！'));
                        return;
                    }
                    var aStr1 = self.recordSet.fieldByName('销售合同').val().split(';');
                    var aStr2 = self.recordSet.fieldByName('采购合同').val().split(';');
                    fnInCost(self, aStr1, aStr2);
                });
            }

            self.addButton("bShipmentStatus", "出运状态", "", "bookmark icon", true, true); //下拉菜单
            self.button("bShipmentStatus").addButton("bInspection", '<a class="ui orange label">' + _.language.get('已验货') + '</a>', function () {
                VLIB.Status(self, '出运明细', 'Shipments', '出运状态', 'ShipmentStatus', '已验货');
            });
            self.button("bShipmentStatus").addButton("bCockpit", '<a class="ui yellow label">' + _.language.get('已配舱') + '</a>', function () {
                VLIB.Status(self, '出运明细', 'Shipments', '出运状态', 'ShipmentStatus', '已配舱');
            });
            self.button("bShipmentStatus").addButton("bInWarehouse", '<a class="ui olive label">' + _.language.get('已进仓') + '</a>', function () {
                VLIB.Status(self, '出运明细', 'Shipments', '出运状态', 'ShipmentStatus', '已进仓');
            });
            self.button("bShipmentStatus").addButton("bShipmentsTo", '<a class="ui green label">' + _.language.get('已出货') + '</a>', function () {
                VLIB.Status(self, '出运明细', 'Shipments', '出运状态', 'ShipmentStatus', '已出货');
            });
            self.button("bShipmentStatus").addButton("bConfirm", '<a class="ui teal label">' + _.language.get('提单确认') + '</a>', function () {
                VLIB.Status(self, '出运明细', 'Shipments', '出运状态', 'ShipmentStatus', '提单确认');
            });
            self.button("bShipmentStatus").addButton("bCollection", '<a class="ui blue label">' + _.language.get('收缴提单发票') + '</a>', function () {
                VLIB.Status(self, '出运明细', 'Shipments', '出运状态', 'ShipmentStatus', '收缴提单发票');
            });
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY, EVT_SEARCHFORM_CREATED], btn_Shipments);

//---<出运明细_FormOnShow>
function evt_Shipments_FormOnShow(obj) {
    var self = obj.form;
    if (self.moduleName == '出运明细') {
        //出运状态判断只读
        try {
            var oSQL = _.db.execute('Shipments_Select_Settlements2', {
                "values": {
                    "srid": self.recordSet.fieldByName('rid').val()
                }
            });
            if (oSQL.length > 0) {
                ['发票号码', '客户编号', '销售币种', '汇率', '价格条款', '结汇方式', '佣金比率', '保险加成',
                    '保险比率', '佣金金额', '保险费用'
                ].forEach(function (element) {
                    self.field(element).disable();
                }, this);
                ['产品资料', '采购明细', '客户相关费用'].forEach(function (element) {
                    self.area(element).disable();
                });
            }
        } catch (err) {
            _.log.error('[出运明细]相应内容只读错误！');
        }
        //海运费币种
        if (self.recordSet.fieldByName('海运费币种').val().length == 0 && self.recordSet.fieldByName('海运费汇率').val() == 0) {
            if (window.aconfig) {
                var oSQL = _.db.execute('Shipments_Select_Dic_Currency', {
                    "values": {
                        "sCurrencyCode": window.aconfig.Shipments_SeaFreightCurrencyCoBx
                    }
                });
                if (oSQL.length == 0) {
                    _.ui.showWarnning(_.language.get('业务字典-货币代码未完善汇率栏目:') + window.aconfig.Shipments_SeaFreightCurrencyCoBx);
                } else {
                    self.recordSet.fieldByName('海运费币种').val(window.aconfig.Shipments_SeaFreightCurrencyCoBx);
                    self.recordSet.fieldByName('海运费汇率').val(oSQL[0].Rate);
                }
            } else {
                var oSQL = _.db.execute('Shipments_Select_Dic_Currency', {
                    "values": {
                        "sCurrencyCode": 'USD'
                    }
                });
                if (oSQL.length == 0) {
                    _.ui.showWarnning(_.language.get('业务字典-货币代码未完善美金汇率栏目！'));
                } else {
                    self.recordSet.fieldByName('海运费币种').val('USD');
                    self.recordSet.fieldByName('海运费汇率').val(oSQL[0].Rate);
                }
            }
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], evt_Shipments_FormOnShow);

//---<出运明细_BeforeSave>
function evt_Shipments_BeforeSave(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == '出运明细') {
            var sPurchaseOrderNos = VLIB.dedupe(self.recordSet.fieldByName("采购明细.采购合同").getColValue()).join(';');
            self.recordSet.fieldByName("采购合同").val(sPurchaseOrderNos);
            //自动生成结算中心
            var sInvoiceNO, sShipmentStatus;
            var oSQL = _.db.execute('Shipments_Select_Shipments2', {
                "values": {
                    "srid": self.recordSet.fieldByName('rid').val()
                }
            });
            if (oSQL.length > 0) {
                sInvoiceNO = oSQL[0].InvoiceNO;
                sShipmentStatus = oSQL[0].ShipmentStatus;
            }
            // if (sShipmentStatus == '已出货' || sShipmentStatus == '提单确认' || sShipmentStatus == '收缴提单发票') {
            //     var oSQL = _.db.execute('Shipments_Select_Settlements3', {
            //         "values": {
            //             "sInvoiceNO": sInvoiceNO
            //         }
            //     });
            //     if (oSQL.length == 0) {
            //         _.ui.yesOrNo(
            //             _.language.get('该记录已符合生成结算中心条件，同意生成后将锁定该记录！'),
            //             okfunc = function () {
            //                 VLIB.cxAutoData(self, srid, '出运明细.发票号码', '结算中心.发票号码', '', '', '', false);
            //                 var aDisableList = ['发票号码', '客户编号', '销售币种', '汇率', '价格条款', '结汇方式', '佣金比率', '保险加成', '保险比率', '佣金金额', '保险费用'];
            //                 aDisableList.forEach(function (element) {
            //                     self.field(element).disable();
            //                 });
            //                 self.area('产品资料').disable();
            //                 self.area('采购明细').disable();
            //                 self.area('客户相关费用').disable();
            //             }
            //         );
            //     }
            // }

            // 溢短比率
            var oTable = self.recordSet.tableByName('产品资料');
            var fOrderQty, fShippingQty, fOverflowShortRatio, fSetOverflowShortRatio;
            var bResult = false;
            if (self.recordSet.fieldByName('可否分批').val() != 'Yes') {
                oTable.disableControl();
                var iBookMark = oTable.cursor();
                oTable.cursor(0, false);
                try {
                    oTable.down(function () {
                        var sSOL_RecordID = self.recordSet.fieldByName('产品资料.产品标识').val();
                        var oSQL = _.db.execute('Shipments_Select_SalesOrdersline', {
                            "values": {
                                "sSOL_RecordID": sSOL_RecordID
                            }
                        });
                        if (oSQL.length > 0) {
                            fOrderQty = _.convert.toFloat(oSQL[0].OrderQty);
                        }
                        var oSQL = _.db.execute('Shipments_Select_ShipmentsLine', {
                            "values": {
                                "sSOL_RecordID": sSOL_RecordID,
                                "srid": self.recordSet.fieldByName('rid').val()
                            }
                        });
                        if (oSQL.length > 0) {
                            fShippingQty = _.convert.toFloat(oSQL[0].yj);
                        }
                        if (fOrderQty > 0) {
                            fOverflowShortRatio = 100 * (((fShippingQty + self.recordSet.fieldByName('产品资料.出货数量').val()) / fOrderQty) - 1)
                        } else {
                            fOverflowShortRatio = 0;
                        }
                        self.recordSet.fieldByName('产品资料.溢短比率').val(fOverflowShortRatio);
                        if (window.aconfig) {
                            fSetOverflowShortRatio = window.aconfig.Shipments_OverflowShortRatio;
                        } else {
                            fSetOverflowShortRatio = 5; //---溢短比率默认5%
                        }
                        if (Math.abs(0 - fOverflowShortRatio) > fSetOverflowShortRatio) {
                            bResult = true;
                        }
                    });
                } finally {
                    oTable.cursor(iBookMark, true);
                    oTable.enableControl('Batch_Shipments6');
                }
                if (bResult) {
                    _.ui.showWarnning(_.language.get('系统识别出货数量溢短比率超标，请注意销售风险！'));
                }
            }

            //采购明细_开票数量计算
            var fShippingTotalValue;
            var aSOL_RecordIDs = [];
            var aShippingTotalValues = [];
            var aShippingQtys = [];
            //---循环产品资料
            oTable.disableControl();
            var iBookMark = oTable.cursor();
            oTable.cursor(0, false);
            try {
                oTable.down(function () {
                    aSOL_RecordIDs.push(self.recordSet.fieldByName('产品资料.产品标识').val());
                    if (self.recordSet.fieldByName('产品资料.计价方式').val() == '重量') {
                        aShippingQtys.push(self.recordSet.fieldByName('产品资料.总净重').val());
                    } else {
                        aShippingQtys.push(self.recordSet.fieldByName('产品资料.出货数量').val());
                    }
                });
            } finally {
                oTable.cursor(iBookMark, true);
                oTable.enableControl('Batch_Shipments7');
            }
            //---循环采购明细
            var oTable = self.recordSet.tableByName('采购明细');
            for (var i in aSOL_RecordIDs) {
                fShippingTotalValue = 0;
                oTable.disableControl();
                var iBookMark = oTable.cursor();
                oTable.cursor(0, false);
                try {
                    oTable.down(function () {
                        if (self.recordSet.fieldByName('采购明细.产品标识').val() && self.recordSet.fieldByName('采购明细.是否报关').val()) {
                            if (aSOL_RecordIDs[i] == self.recordSet.fieldByName('采购明细.产品标识').val()) {
                                fShippingTotalValue = fShippingTotalValue + self.recordSet.fieldByName('采购明细.采购总价').val();
                            }
                        }
                    });
                } finally {
                    oTable.cursor(iBookMark, true);
                    oTable.enableControl('Batch_Shipments8');
                }
                aShippingTotalValues.push(fShippingTotalValue);
            }

            oTable.disableControl();
            var iBookMark = oTable.cursor();
            oTable.cursor(0, false);
            try {
                oTable.down(function () {
                    //开票数量=产品资料.出货数量*采购明细.采购总价/某产品标识SUM(采购明细.采购总价)
                    if (self.recordSet.fieldByName('报关方式').val() != '配件报关') {
                        if (self.recordSet.fieldByName('采购明细.是否报关').val()) {
                            //报关+开票
                            var iSQLRIDIndex = aSOL_RecordIDs.indexOf(self.recordSet.fieldByName('采购明细.产品标识').val());
                            if (aShippingTotalValues[iSQLRIDIndex] > 0) {
                                self.recordSet.fieldByName('采购明细.开票数量').val((aShippingQtys[iSQLRIDIndex] * self.recordSet.fieldByName('采购明细.采购总价').val() / aShippingTotalValues[iSQLRIDIndex]).toFixed(2));
                            } else {
                                self.recordSet.fieldByName('采购明细.开票数量').val(0);
                            }
                        } else if (!self.recordSet.fieldByName('采购明细.是否报关').val() && self.recordSet.fieldByName('采购明细.是否开票').val()) {
                            //不报关+开票
                            self.recordSet.fieldByName('采购明细.开票数量').val(self.recordSet.fieldByName('采购明细.出货数量').val());
                        } else {
                            //不报关+不开票
                            self.recordSet.fieldByName('采购明细.开票数量').val(0);
                        }
                    } else {
                        if (self.recordSet.fieldByName('采购明细.计价方式').val() == '数量') {
                            self.recordSet.fieldByName('采购明细.开票数量').val(self.recordSet.fieldByName('采购明细.出货数量').val());
                        } else {
                            self.recordSet.fieldByName('采购明细.开票数量').val(self.recordSet.fieldByName('采购明细.总净重').val());
                        }
                    }
                });
            } finally {
                oTable.cursor(iBookMark, true);
                oTable.enableControl('Batch_Shipments9');
            }

            //---检查费用调用情况
            var aSalesOrderNoList = [];
            var aPurchaseOrderNoList = [];
            var aSalesOrderNoList2 = [];
            var aPurchaseOrderNoList2 = [];
            var bCostsResult = false;
            var j = 0;
            if (self.recordSet.tableByName('采购明细').recordCount() == 0) {
                resolve();
                return;
            }
            aSalesOrderNoList = self.recordSet.fieldByName('销售合同').val().split(';');
            aPurchaseOrderNoList = self.recordSet.fieldByName('采购合同').val().split(';');
            if (self.recordSet.fieldByName('客户相关费用合计').val() > 0) {
                bCostsResult = true;
            }
            for (var i in aSalesOrderNoList) {
                //如果费用合计>0则将该单涉及的销售合同反统计回[销售合同]-“费用标识”
                if (bCostsResult) {
                    _.db.execute('Shipments_Update_SalesOrders', {
                        "values": {
                            "sUsedGUID": aSalesOrderNoList[i],
                            "sSalesOrderNo": aSalesOrderNoList[i]
                        }
                    });
                }
                var oSQL = _.db.execute('Shipments_Select_SalesOrders', {
                    "values": {
                        "sSalesOrderNo": aSalesOrderNoList[i],
                        "sSalesOrderNo2": aSalesOrderNoList[i]
                    }
                });
                if (oSQL.length > 0) {
                    for (var p in oSQL) {
                        aSalesOrderNoList2.push(oSQL[p]);
                    }
                    j++;
                }
            }

            for (var i in aPurchaseOrderNoList) {
                //如果费用合计>0则将该单涉及的采购合同反统计回[采购合同]-“费用标识”
                if (bCostsResult) {
                    _.db.execute('Shipments_Update_PurchaseOrders', {
                        "values": {
                            "sUsedGUID": aPurchaseOrderNoList[i],
                            "sPurchaseOrderNo": aPurchaseOrderNoList[i]
                        }
                    });
                }
                var oSQL = _.db.execute('Shipments_Select_PurchaseOrders', {
                    "values": {
                        "sPurchaseOrderNo": aPurchaseOrderNoList[i],
                        "sPurchaseOrderNo2": aPurchaseOrderNoList[i]
                    }
                });
                if (oSQL.length > 0) {
                    for (var p in oSQL) {
                        aPurchaseOrderNoList2.push(oSQL[p]);
                    }
                    j++;
                }
            }
            if (j > 0) {
                _.ui.yesOrNo(
                    _.language.get('该票出运计划有未调入的费用，记录[费用明细]是否重新导入?'),
                    okfunc = function () {
                        fnInCost(self, aSalesOrderNoList2, aPurchaseOrderNoList2);
                        for (var i in aSalesOrderNoList2) {
                            _.db.execute('Shipments_Update_SalesOrders', {
                                "values": {
                                    "sUsedGUID": aSalesOrderNoList2[i],
                                    "sSalesOrderNo": aSalesOrderNoList2[i]
                                }
                            });
                        }
                        for (var i in aPurchaseOrderNoList2) {
                            _.db.execute('Shipments_Update_PurchaseOrders', {
                                "values": {
                                    "sUsedGUID": aPurchaseOrderNoList2[i],
                                    "sPurchaseOrderNo": aPurchaseOrderNoList2[i]
                                }
                            });
                        }
                    }
                );
            }
            resolve();
        } else {
            resolve();
        }
    });

}
addPromiseListener([EVT_RECORDSET_BEFORE_SAVE], evt_Shipments_BeforeSave);

//---<出运明细_AfterSave>
function evt_Shipments_AfterSave(obj) {
    var self = obj.form;
    if (self.moduleName == '出运明细') {
        var sInvoiceNO, sSeaFreightCurrency, fSeaFreightExchangeRate, fSeaFreight, fMiscellaneous;
        sInvoiceNO = self.recordSet.fieldByName('发票号码').val();
        sSeaFreightCurrency = self.recordSet.fieldByName('海运费币种').val();
        fSeaFreightExchangeRate = self.recordSet.fieldByName('海运费汇率').val();
        fSeaFreight = self.recordSet.fieldByName('海运费').val();
        fMiscellaneous = self.recordSet.fieldByName('运杂费').val();
        var oSQL = _.db.execute('Shipments_Select_ProfitAccounting', {
            "values": {
                "sKeyNo": sInvoiceNO
            }
        });
        if (oSQL.length > 0) {
            if (sSeaFreightCurrency != oSQL[0].SeaFreightCurrency || fSeaFreightExchangeRate - oSQL[0].SeaFreightExchangeRate != 0 || fSeaFreight - oSQL[0].SeaFreight != 0 || fMiscellaneous - oSQL[0].Miscellaneous != 0) {
                _.app.ui.createEditor({
                    moduleName: "利润核算",
                    rid: oSQL[0].rid,
                    onInit: function (oEditor) {
                        oEditor.recordSet.fieldByName('海运费币种').val(sSeaFreightCurrency);
                        oEditor.recordSet.fieldByName('海运费汇率').val(fSeaFreightExchangeRate);
                        oEditor.recordSet.fieldByName('海运费').val(fSeaFreight);
                        oEditor.recordSet.fieldByName('运杂费').val(fMiscellaneous);
                        oEditor.save(false, function (oRecord) {
                            if (oRecord) {
                                _.ui.Message({
                                    msg: _.language.get("系统发现海运费币种、海运费汇率、海运费、运杂费，其中有数据与[利润核算]有差异，系统已自动同步！"),
                                    center: "center", //居中
                                    autoClose: true, //是否自动关闭
                                    showClose: false, //是否显示关闭按钮
                                    type: 2, //info: 1, success: 2, warning: 3, error: 4
                                    closeTime: 5000 //自动关闭时间
                                })
                            }
                        });
                    },
                    onError: function (oRecord) {
                        if (oRecord) {
                            _.log.error('保存失败！');
                        }
                    },
                    async: true
                });
            }
        }
    }
}
addListener([EVT_RECORDSET_AFTER_SAVE], evt_Shipments_AfterSave);

//---<出运明细_BeforeDelete>
function evt_Shipments_BeforeDelete(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == '出运明细') {
            var srid;
            if (self.type == 'search') {
                srid = self.rid;
            } else {
                srid = self.recordSet.fieldByName('rid').val();
            }
            _.db.execute('Shipments_Update_ShipingPlans', {
                "values": {
                    "srid": srid
                }
            });
            resolve();
        } else {
            resolve();
        }
    });
}
addPromiseListener([EVT_SEARCHFORM_BEFORE_DELETE, EVT_EDITFORM_BEFORE_DELETE], evt_Shipments_BeforeDelete);

//---<出运明细_数量合计>
function evt_Shipments_QTYTotal(obj) {
    var self = obj.form;
    if (self.moduleName == '出运明细') {
        if (obj.table.name == '产品资料') {
            VLIB.cxRightUnitSUM(self, '产品资料', '出货数量', '计量单位', '数量合计', 'L');
        }
    }
}
addListener([EVT_RECORDSET_AFTER_CHILD_NEW, EVT_RECORDSET_AFTER_CHILD_COPY, EVT_RECORDSET_AFTER_CHILD_INSERT, EVT_RECORDSET_AFTER_CHILD_DELETE], evt_Shipments_QTYTotal);

//---<出运明细_箱数合计>
function evt_Shipments_CTNTotal(obj) {
    var self = obj.form;
    if (self.moduleName == '出运明细') {
        if (obj.table.name == '产品资料') {
            VLIB.cxRightUnitSUM(self, '产品资料', '箱数', '外箱单位', '箱数合计', 'L');
        }
    }
}
addListener([EVT_RECORDSET_AFTER_CHILD_NEW, EVT_RECORDSET_AFTER_CHILD_COPY, EVT_RECORDSET_AFTER_CHILD_INSERT, EVT_RECORDSET_AFTER_CHILD_DELETE], evt_Shipments_CTNTotal);

function cge_RecordSet_Shipments(obj) {
    var self = obj.form;
    var cgeField = obj.field;
    if (self.moduleName == '出运明细') {
        //---<出运明细_计算应付款日>
        var aFullName = ['出运明细.出运日期', '出运明细.采购明细.付款天数'];
        if ($.inArray(cgeField.fullName, aFullName) != -1) {
            var oTable = self.recordSet.tableByName('采购明细');
            oTable.disableControl();
            var iBookMark = oTable.cursor();
            oTable.cursor(0, false);
            try {
                if (self.recordSet.fieldByName('出运日期').val().length > 0) {
                    oTable.down(function () {
                        var dPaymentDate = _.date.incDay((new Date(self.recordSet.fieldByName('出运日期').val())).Format("yyyy-MM-dd"), _.convert.toInteger(self.recordSet.fieldByName('采购明细.付款天数').val()));
                        self.recordSet.fieldByName('采购明细.应付款日').val(dPaymentDate);
                    });
                }
            } finally {
                oTable.cursor(iBookMark, true);
                oTable.enableControl('Batch_Shipments10');
            }
        }
        //---<出运明细_数量合计>
        var aFullName = ['出运明细.产品资料.出货数量', '出运明细.产品资料.计量单位'];
        if ($.inArray(cgeField.fullName, aFullName) != -1) {
            VLIB.cxRightUnitSUM(self, '产品资料', '出货数量', '计量单位', '数量合计', 'L');
        }
        //---<出运明细_箱数合计>
        var aFullName = ['出运明细.产品资料.外箱单位', '出运明细.产品资料.箱数'];
        if ($.inArray(cgeField.fullName, aFullName) != -1) {
            VLIB.cxRightUnitSUM(self, '产品资料', '箱数', '外箱单位', '箱数合计', 'L');
        }
        //---<是否报关>
        if (cgeField.fullName == '出运明细.采购明细.是否报关') {
            if (!self.recordSet.fieldByName('采购明细.是否报关').val() && self.recordSet.fieldByName('采购明细.报关中文品名').val().length == 0) {
                self.recordSet.fieldByName('采购明细.报关中文品名').val('无需报关');
            } else if (self.recordSet.fieldByName('采购明细.是否报关').val() && self.recordSet.fieldByName('采购明细.报关中文品名').val() == '无需报关') {
                self.recordSet.fieldByName('采购明细.报关中文品名').val([]);
            }
        }
    }
}
addListener([EVT_RECORDSET_AFTER_FIELD_CHANGED], cge_RecordSet_Shipments);

//---<出运明细_记录复制>
function evt_Shipments_aftercopy(obj) {
    var self = obj.form;
    if (self.moduleName == "出运明细") {
        oTable = self.recordSet.tableByName("产品资料");
        oTable2 = self.recordSet.tableByName("采购明细");

        self.recordSet.fieldByName('已申请国外').val(0);
        self.recordSet.fieldByName('已申请国内').val(0);
        var iBookMark = oTable.cursor();
        oTable.cursor(0, false);
        try {
            oTable.down(function () {
                self.recordSet.fieldByName('产品资料.已出库数').val(0);
            }); //down是从上往下滚，up是从下往上滚；
        } finally {
            oTable.cursor(iBookMark, true); //回滚至初始焦点记录
        }

        var iBookMark2 = oTable.cursor();
        oTable.cursor(0, false);
        try {
            oTable.down(function () {
                self.recordSet.fieldByName('采购明细.开票金额').val(0);
            }); //down是从上往下滚，up是从下往上滚；
        } finally {
            oTable.cursor(iBookMark2, true); //回滚至初始焦点记录
        }
    }
}
addListener([EVT_RECORDSET_AFTER_COPY], evt_Shipments_aftercopy);

//---<出运明细_产品资料_采购明细记录复制>
function evt_Shipments_Child_aftercopy(obj) {
    var self = obj.form;
    if (self.moduleName == '出运明细') {
        if (obj.table.name == '产品资料') {
            self.recordSet.fieldByName('产品资料.已出库数').val(0);
        }
        if (obj.table.name == '采购明细') {
            self.recordSet.fieldByName('采购明细.开票金额').val(0);
        }
    }
}
addListener([EVT_RECORDSET_AFTER_CHILD_COPY], evt_Shipments_Child_aftercopy);