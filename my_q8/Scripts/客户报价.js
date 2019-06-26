//---<客户报价_控制字段只读>
var fnProfitRate = function (self) {
    if (self.recordSet.fieldByName('报价模式').val() == '直接销售价') {
        self.field("产品资料.利润率").disable();
    } else {
        self.field("产品资料.利润率").enable();
    }
    if (self.recordSet.fieldByName('报价模式').val() == '利润率算销售价') {
        self.field("产品资料.销售单价").disable();
    } else {
        self.field("产品资料.销售单价").enable();
    }
    if (self.recordSet.fieldByName('报价模式').val() != '利润率算销售价') {
        self.field('统一利润率').disable();
    } else {
        self.field('统一利润率').enable();
    }
};

//---<客户报价_采购及退税合计>
var fnQuotations_PurchTotal_Rebates = function (self) {
    try {
        var oSQL = _.db.execute('Quotations_Select_Customers', {
            "values": {
                "sCustomerNo": self.recordSet.fieldByName('客户编号').val()
            }
        });
        if (oSQL.length > 0 && !_.utils.isNull(oSQL[0].IsEXW)) {
            VLIB.cxPurchTotal(self, '产品资料', _.convert.toBoolean(oSQL[0].IsEXW));
        } else {
            VLIB.cxPurchTotal(self, '产品资料', false);
        }
    } catch (err) {
        _.log.error('计算采购及退税错误！');
    }
};


function btn_Quotations(obj) {
    var self = obj.form;
    if (self.moduleName == '客户报价') {
        //---<客户报价_统一利润率>
        var fnQuotations_UniformProfit = function () {
            try {
                _.ui.yesOrNo(
                    _.language.get('是否统一产品资料的利润率！'),
                    okfunc = function () {
                        if (self.modified) {
                            self.UIsave(false);
                        }
                        var fCTD = self.recordSet.fieldByName('统一利润率').val();
                        var oTable = self.recordSet.tableByName('产品资料');
                        oTable.disableControl();
                        var iBookMark = oTable.cursor();
                        oTable.cursor(0, false);
                        try {
                            oTable.down(function () {
                                self.recordSet.fieldByName('产品资料.利润率').val(fCTD);
                            });
                        } finally {
                            oTable.cursor(iBookMark, true);
                            oTable.enableControl('Batch_Quotations');
                        }
                    }
                );
            } catch (err) {
                _.log.error('统一利润率发生错误！');
            }
        };
        //---<客户报价_新建产品推荐>
        var fnQuotations_Recommend = function () {
            try {
                var sModuleName = '产品推荐';
                var oModulePermission = _.app.permission.getModulePermission(sModuleName);
                if (!oModulePermission.new) {
                    _.ui.showWarnning(sModuleName + _.language.get('您没有新建该模块的权限！'));
                    return;
                }
                var aItems = [];
                var oTable = self.recordSet.tableByName('产品资料');
                oTable.disableControl();
                var iBookMark = oTable.cursor();
                oTable.cursor(0, false);
                try {
                    oTable.down(function () {
                        aItems.push(self.recordSet.fieldByName('产品资料.产品编号').val());
                    });
                } finally {
                    oTable.cursor(iBookMark, true);
                    oTable.enableControl('Batch_Quotations2');
                }
                _.app.ui.openEditor('new', '产品推荐', '', function (oEditor) {
                    _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i><span class="text"></span>', function (el) {
                        var oTable = oEditor.recordSet.tableByName('产品资料');
                        oTable.disableControl();
                        el.css("width", "220px!important");
                        el.css("line-height", "20px");
                        _.utils.processQueue(aItems, function (idx, element) {
                            oTable.append();
                            oEditor.recordSet.fieldByName('产品资料.产品编号').val(element);
                            el.find(".text").html(_.language.get("正在操作") + '！<br/>(' + _.language.get("第") + idx + _.language.get("条") + '，' + _.language.get("共") + aItems.length + _.language.get("条") + '！)');
                        }, function () {
                            oTable.enableControl('Batch_Quotations3');
                            _.ui.closeWatting();
                        });
                    });
                });
            } catch (err) {
                _.log.error('新建产品推荐发生错误！');
            }
        };

        //---<客户报价_新建客户资料>
        var fnQuotations_NewCustomer = function () {
            var sCustomerShortName = self.recordSet.fieldByName('客户简称').val();
            var oSQL = _.db.execute('Quotations_Select_CustomerShortName', {
                "values": {
                    "sCustomerShortName": sCustomerShortName
                }
            });
            if (oSQL.length > 0) {
                _.ui.showWarnning('[' + oSQL[0].sModule + ']/' + oSQL[0].CustomerNo + ':' + _.language.get('该客商已建档！'));
            } else {
                _.app.ui.createEditor({
                    moduleName: "客户资料",
                    onInit: function (oEditor) {
                        oEditor.recordSet.fieldByName('客户编号').val(self.recordSet.fieldByName('客户编号').val());
                        oEditor.recordSet.fieldByName('客户简称').val(sCustomerShortName);
                        oEditor.save(false, function (oRecord) {
                            if (oRecord) {
                                if (self.recordSet.fieldByName('客户编号').val() != oRecord.recordSet.fieldByName('客户编号').val()) {
                                    self.recordSet.fieldByName('客户编号').val(oRecord.recordSet.fieldByName('客户编号').val());
                                }
                                _.ui.yesOrNo(
                                    _.language.get('[客户资料]新建成功，是否进一步完善其他信息？'),
                                    okfunc = function () {
                                        _.app.ui.openEditor('edit', '客户资料', oRecord.recordSet.fieldByName('rid').val()); //可以打开记录
                                    },
                                    cancelfunc = function () {

                                    }
                                );
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
        };

        //---<客户报价_新建产品资料>
        var fnQuotations_NewItems = function () {
            _.app.ui.createEditor({
                moduleName: "产品资料",
                onInit: function (oEditor) {
                    oEditor.recordSet.fieldByName('产品编号').val(self.recordSet.fieldByName('产品资料.产品编号').val());
                    oEditor.recordSet.fieldByName('英文规格').val(self.recordSet.fieldByName('产品资料.英文规格').val());
                    oEditor.recordSet.fieldByName('中文规格').val(self.recordSet.fieldByName('产品资料.中文规格').val());
                    oEditor.recordSet.fieldByName('中文品名').val(self.recordSet.fieldByName('产品资料.中文品名').val());
                    oEditor.recordSet.fieldByName('英文品名').val(self.recordSet.fieldByName('产品资料.英文品名').val());
                    oEditor.recordSet.fieldByName('专业描述1').val(self.recordSet.fieldByName('产品资料.专业描述1').val());
                    oEditor.recordSet.fieldByName('专业描述2').val(self.recordSet.fieldByName('产品资料.专业描述2').val());
                    oEditor.recordSet.fieldByName('专业描述3').val(self.recordSet.fieldByName('产品资料.专业描述3').val());
                    oEditor.recordSet.fieldByName('专业描述4').val(self.recordSet.fieldByName('产品资料.专业描述4').val());
                    oEditor.recordSet.fieldByName('专业描述5').val(self.recordSet.fieldByName('产品资料.专业描述5').val());
                    oEditor.recordSet.fieldByName('计量单位').val(self.recordSet.fieldByName('产品资料.计量单位').val());
                    oEditor.recordSet.fieldByName('采购单价').val(self.recordSet.fieldByName('产品资料.采购单价').val());
                    oEditor.recordSet.fieldByName('专业描述6').val(self.recordSet.fieldByName('产品资料.专业描述6').val());
                    oEditor.recordSet.fieldByName('专业描述7').val(self.recordSet.fieldByName('产品资料.专业描述7').val());
                    oEditor.recordSet.fieldByName('中文说明').val(self.recordSet.fieldByName('产品资料.中文说明').val());
                    oEditor.recordSet.fieldByName('英文说明').val(self.recordSet.fieldByName('产品资料.英文说明').val());
                    oEditor.recordSet.fieldByName('销售单价').val(self.recordSet.fieldByName('产品资料.销售单价').val());
                    oEditor.recordSet.fieldByName('产品条码').val(self.recordSet.fieldByName('产品资料.产品条码').val());

                    if (self.recordSet.fieldByName('产品资料.厂商简称').val().length > 0) {
                        oEditor.recordSet.tableByName('工厂报价').append();
                        oEditor.recordSet.fieldByName('工厂报价.采购币种').val(self.recordSet.fieldByName('产品资料.采购币种').val());
                        oEditor.recordSet.fieldByName('工厂报价.采购单价').val(self.recordSet.fieldByName('产品资料.采购单价').val());
                        oEditor.recordSet.fieldByName('工厂报价.厂商编号').val(self.recordSet.fieldByName('产品资料.厂商编号').val());
                        oEditor.recordSet.fieldByName('工厂报价.厂商简称').val(self.recordSet.fieldByName('产品资料.厂商简称').val());
                        oEditor.recordSet.fieldByName('工厂报价.工厂货号').val(self.recordSet.fieldByName('产品资料.工厂货号').val());
                        oEditor.recordSet.fieldByName('工厂报价.起订量').val(self.recordSet.fieldByName('产品资料.起订量').val());
                        oEditor.recordSet.fieldByName('工厂报价.是否开票').val(self.recordSet.fieldByName('产品资料.是否开票').val());
                        oEditor.recordSet.fieldByName('工厂报价.计量单位').val(self.recordSet.fieldByName('产品资料.计量单位').val());
                        oEditor.recordSet.fieldByName('工厂报价.内盒装量').val(self.recordSet.fieldByName('产品资料.内盒装量').val());
                        oEditor.recordSet.fieldByName('工厂报价.外箱装量').val(self.recordSet.fieldByName('产品资料.外箱装量').val());
                        oEditor.recordSet.fieldByName('工厂报价.外箱单位').val(self.recordSet.fieldByName('产品资料.外箱单位').val());
                        oEditor.recordSet.fieldByName('工厂报价.外箱长度').val(self.recordSet.fieldByName('产品资料.外箱长度').val());
                        oEditor.recordSet.fieldByName('工厂报价.外箱宽度').val(self.recordSet.fieldByName('产品资料.外箱宽度').val());
                        oEditor.recordSet.fieldByName('工厂报价.外箱高度').val(self.recordSet.fieldByName('产品资料.外箱高度').val());
                        oEditor.recordSet.fieldByName('工厂报价.外箱体积').val(self.recordSet.fieldByName('产品资料.外箱体积').val());
                        oEditor.recordSet.fieldByName('工厂报价.外箱毛重').val(self.recordSet.fieldByName('产品资料.外箱毛重').val());
                        oEditor.recordSet.fieldByName('工厂报价.外箱净重').val(self.recordSet.fieldByName('产品资料.外箱净重').val());
                        oEditor.recordSet.fieldByName('工厂报价.20#装量').val(self.recordSet.fieldByName('产品资料.20#装量').val());
                        oEditor.recordSet.fieldByName('工厂报价.40#装量').val(self.recordSet.fieldByName('产品资料.40#装量').val());
                        oEditor.recordSet.fieldByName('工厂报价.40HQ#装量').val(self.recordSet.fieldByName('产品资料.40HQ#装量').val());
                    }
                    oEditor.save(false, function (oRecord) {
                        if (oRecord) {
                            if (self.recordSet.fieldByName('产品资料.产品编号').val() != oRecord.recordSet.fieldByName('产品编号').val()) {
                                self.recordSet.fieldByName('产品资料.产品编号').val(oRecord.recordSet.fieldByName('产品编号').val());
                            }
                            _.ui.yesOrNo(
                                _.language.get('[产品资料]新建成功，是否进一步完善其他信息？'),
                                okfunc = function () {
                                    _.app.ui.openEditor('edit', '产品资料', oRecord.recordSet.fieldByName('rid').val()); //可以打开记录
                                },
                                cancelfunc = function () {

                                }
                            );
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
        };

        //---<客户报价_条码输入>
        var fnQuotations_BarcodeInput = function () {
            _.app.ui.showModal({
                'id': "Quotations_BarcodeInput",
                'width': 300,
                'height': 160,
                'closable': false,
                'header': _.language.get("条码输入"),
                'html': '<div style="height:100%;padding:10px">\
                            <div class="row ui input" style="width:100%;margin-bottom:10px"><label style="margin-right:10px;line-height:32px">' + _.language.get('条码') + '</label><input type="text" id="fBarcode">\
                            </div>\
                            <div class="row ui input" style="width:100%"><label style="margin-right:10px;line-height:32px">' + _.language.get('数量') + '</label><input type="text" id="fQty">\
                            </div>\
                        </div>',
                'showfunc': function (oForm) {
                    setTimeout(function () {
                        oForm.find("#fBarcode").focus();
                    }, 100);
                    oForm.find("#fBarcode").bind("keydown", function (oBarcode) {
                        if (oBarcode.keyCode == 13) {
                            oForm.find("#fQty").focus();
                        }

                    });
                    oForm.find("#fQty").bind("keydown", function (oQty) {
                        if (oQty.keyCode == 13) {
                            var oTable = self.recordSet.tableByName('产品资料');
                            oTable.append();
                            self.recordSet.fieldByName('产品资料.产品条码').val($("#fBarcode").val());
                            self.recordSet.fieldByName('产品资料.报价数量').val($("#fQty").val());
                            $("#fBarcode").val("");
                            $("#fQty").val("");
                            oForm.find("#fBarcode").focus();
                        }
                    });

                }
            });
        };

        if (self.addButton) {
            self.addButton("bExtend", _.language.get("扩展"), "", "yelp", true, true); //下拉菜单
            self.area('产品资料').addButton("bSheetExtend", _.language.get("扩展"), "", "yelp", true, true);

            self.button('bExtend').addButton("bQuotationsRecommend", _.language.get("给客户推荐产品"), function () {
                fnQuotations_Recommend();
            });

            self.button('bExtend').addButton("bQuotationsCustomers", _.language.get("新建客户资料"), function () {
                fnQuotations_NewCustomer();
            });

            self.area('产品资料').button('bSheetExtend').addButton("bUniformProfit", _.language.get("统一利润率"), function () {
                fnQuotations_UniformProfit();
            });

            self.area('产品资料').button('bSheetExtend').addButton("bNewItems", _.language.get("新建产品资料"), function () {
                fnQuotations_NewItems();
            });

            self.area('产品资料').addButton("bQuotationsBarcodeInput", _.language.get("条码输入"), function () {
                fnQuotations_BarcodeInput();
            }, "barcode", false, true);
        }

    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], btn_Quotations);

function evt_Quotations_Formonshow_onload(obj) {
    var self = obj.form;
    if (self.moduleName == '客户报价') {
        //---<客户报价_价格条款>
        VLIB.cxTermOfPrice(obj);

        //---<客户报价_控制字段只读>
        fnProfitRate(self);

        //---采集数据可见
        if (self.recordSet.fieldByName('采集来源').val().length > 0) {
            self.field('采集说明').show();
            self.field('采集来源').show();
        } else {
            self.field('采集说明').hide();
            self.field('采集来源').hide();
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], evt_Quotations_Formonshow_onload);

function evt_Quotations_PurchTotal(obj) {
    var self = obj.form;
    if (self.moduleName == '客户报价') {
        if (!obj.table.disabled()) {
            fnQuotations_PurchTotal_Rebates(self); //采购及退税合计
        }
    }
}
addListener([EVT_RECORDSET_AFTER_CHILD_DELETE, EVT_RECORDSET_AFTER_CHILD_NEW], evt_Quotations_PurchTotal);

function cge_RecortSet_Quotations(obj) {
    var self = obj.form;
    var cgeField = obj.field;
    if (self.moduleName == '客户报价') {
        if (cgeField.fullName == '客户报价.价格条款') {
            VLIB.cxTermOfPrice(obj);
        }
        //基准汇率可见
        if (cgeField.fullName == '客户报价.结算类别') {
            if (self.recordSet.fieldByName('结算类别').val() == '代理出口') {
                self.field('基准汇率').show();
            } else {
                self.field('基准汇率').hide();
            }
        }

        if (cgeField.fullName == '客户报价.报价模式') {
            fnProfitRate(self);
        }

        //---<客户报价_利润率算销售单价>
        var aFullName = ['客户报价.产品资料.采购币种', '客户报价.产品资料.外箱装量', '客户报价.产品资料.外箱体积', '客户报价.产品资料.退税率',
            '客户报价.产品资料.采购单价', '客户报价.产品资料.利润率', '客户报价.产品资料.是否开票'
        ];
        if ($.inArray(cgeField.fullName, aFullName) != -1) {
            VLIB.cxQuotationFormula(self, 'S');
        }
        //---<客户报价_销售单价计算利润率>
        var aFullName = ['客户报价.产品资料.采购币种', '客户报价.产品资料.外箱装量', '客户报价.产品资料.外箱体积', '客户报价.产品资料.退税率',
            '客户报价.产品资料.销售单价', '客户报价.产品资料.采购单价', '客户报价.产品资料.是否开票'
        ];
        if ($.inArray(cgeField.fullName, aFullName) != -1) {
            if (self.recordSet.fieldByName('报价模式').val() == '直接销售价') {
                VLIB.cxQuotationFormula(self, 'P');
            }
        }
        //---<客户报价_计算所有销售单价>
        var aFullName = ['客户报价.结算类别', '客户报价.销售币种', '客户报价.汇率', '客户报价.报价模式', '客户报价.保险加成', '客户报价.保险比率',
            '客户报价.佣金比率', '客户报价.单位运费', '客户报价.价格条款', '客户报价.基准汇率'
        ];
        if ($.inArray(cgeField.fullName, aFullName) != -1) {
            VLIB.cxQuotationFormula(self, 'A');
        }

        //---<客户报价_采购及退税合计>
        var aFullName = ['客户报价.结算类别', '客户报价.价格条款', '客户报价.产品资料.采购总价', '客户报价.产品资料.采购币种', '客户报价.产品资料.退税率', '客户报价.产品资料.增值税率'];
        if (!obj.table.disabled() && $.inArray(cgeField.fullName, aFullName) != -1) {
            fnQuotations_PurchTotal_Rebates(self);
        }

        //---<客户报价_计算尺柜装量>
        var aFullName = ['客户报价.产品资料.销售装量', '客户报价.产品资料.外箱体积'];
        if ($.inArray(cgeField.fullName, aFullName) != -1) {
            var fnGetContainerVolume = function (sContainerName) {
                try {
                    var fContainer;
                    var oSQL = _.db.execute('Quotations_Select_Dic_Container', {
                        "values": {
                            "sContainerName": sContainerName
                        }
                    });
                    if (oSQL.length > 0 && !_.utils.isNull(oSQL[0].Volume)) {
                        return _.convert.toFloat(oSQL[0].Volume);
                    } else {
                        switch (sContainerName) {
                            case '20尺柜':
                                fContainer = 28;
                                break;
                            case '40尺柜':
                                fContainer = 58;
                                break;
                            case '40尺高柜':
                                fContainer = 68;
                        }
                    }
                } catch (err) {

                }
                if (fContainer) {
                    return fContainer;
                }
            };
            if (self.recordSet.fieldByName('产品资料.外箱体积').val() != 0) {
                self.recordSet.fieldByName('产品资料.20#装量').val(parseInt(fnGetContainerVolume('20尺柜') * self.recordSet.fieldByName('产品资料.外箱装量').val() / self.recordSet.fieldByName('产品资料.外箱体积').val()));
                self.recordSet.fieldByName('产品资料.40#装量').val(parseInt(fnGetContainerVolume('40尺柜') * self.recordSet.fieldByName('产品资料.外箱装量').val() / self.recordSet.fieldByName('产品资料.外箱体积').val()));
                self.recordSet.fieldByName('产品资料.40HQ#装量').val(parseInt(fnGetContainerVolume('40尺高柜') * self.recordSet.fieldByName('产品资料.外箱装量').val() / self.recordSet.fieldByName('产品资料.外箱体积').val()));
            }
        }

        //---<客户报价_数量合计>
        var aFullName = ['客户报价.产品资料.报价数量', '客户报价.产品资料.计量单位'];
        if (!obj.table.disabled() && $.inArray(cgeField.fullName, aFullName) != -1) {
            VLIB.cxRightUnitSUM(self, '产品资料', '报价数量', '计量单位', '数量合计', 'L');
        }
        //---<客户报价_箱数合计>
        var aFullName = ['客户报价.产品资料.外箱单位', '客户报价.产品资料.箱数'];
        if (!obj.table.disabled() && $.inArray(cgeField.fullName, aFullName) != -1) {
            VLIB.cxRightUnitSUM(self, '产品资料', '箱数', '外箱单位', '箱数合计', 'L');
        }

        //---单位运费币种
        var aFullName = ['客户报价.客户编号', '客户报价.销售币种'];
        if ($.inArray(cgeField.fullName, aFullName) != -1) {
            try {
                if (window.aconfig) {
                    var oSQL = _.db.execute('Shipments_Select_Dic_Currency', {
                        "values": {
                            "sCurrencyCode": window.aconfig.Shipments_SeaFreightCurrencyCoBx
                        }
                    });
                    if (oSQL.length == 0) {
                        _.ui.showWarnning(_.language.get('业务字典-货币代码未完善汇率栏目:') + window.aconfig.Shipments_SeaFreightCurrencyCoBx);
                    } else {
                        self.recordSet.fieldByName('运费币种').val(window.aconfig.Shipments_SeaFreightCurrencyCoBx);
                        self.recordSet.fieldByName('运费汇率').val(oSQL[0].Rate);
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
                        self.recordSet.fieldByName('运费币种').val('USD');
                        self.recordSet.fieldByName('运费汇率').val(oSQL[0].Rate);
                    }
                }
            } catch (err) {
                _.log.error('运费币种调取数据错误！');
            }
        }
    }
}
addListener([EVT_RECORDSET_AFTER_FIELD_CHANGED], cge_RecortSet_Quotations);

//---<客户报价_数量合计_箱数合计>
function evt_Quotations_QTY_CTNTotal(obj) {
    var self = obj.form;
    if (self.moduleName == '客户报价') {
        if (obj.table.name == '产品资料') {
            if (!obj.table.disabled()) {
                VLIB.cxRightUnitSUM(self, '产品资料', '报价数量', '计量单位', '数量合计', 'L');
                VLIB.cxRightUnitSUM(self, '产品资料', '箱数', '外箱单位', '箱数合计', 'L');
            }
        }
    }
}
addListener([EVT_RECORDSET_AFTER_CHILD_NEW, EVT_RECORDSET_AFTER_CHILD_COPY, EVT_RECORDSET_AFTER_CHILD_INSERT, EVT_RECORDSET_AFTER_CHILD_DELETE], evt_Quotations_QTY_CTNTotal);

//---<客户报价_保存前>
function evt_Quotations_beforeSave(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == "客户报价") {
            if (self.recordSet.fieldByName('实际报价日期').val() &&
                _.date.dateDiff(new Date(self.recordSet.fieldByName('询价日期').val()).Format('yyyy-MM-dd'), new Date(self.recordSet.fieldByName('实际报价日期').val()).Format('yyyy-MM-dd')) > 0) {
                _.ui.showWarnning(_.language.get('实际报价日期必须晚于客户的询价日期！'));
                return reject();
            } else {
                resolve();
            }
        } else {
            resolve();
        }
    });
}
addPromiseListener([EVT_RECORDSET_BEFORE_SAVE], evt_Quotations_beforeSave);

//---<客户报价_点击打印前>
function evt_Quotations_beforePrint(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == "客户报价") {

            if (VLIB.cxCheckWorkflowState('客户报价', self.rid) > -1 || (window.aconfig && window.aconfig.Quotations_PrintBeforeStartupCheck)) {
                resolve();
            } else {
                _.ui.showWarnning(_.language.get('系统不允许启动审批前打印报表！详见[配置中心]-[Q系配置]-[全局控制]！'));
                reject();
            }
        } else {
            resolve();
        }
    });
}
addPromiseListener([EVT_SEARCHFORM_BEFORE_REPORT, EVT_EDITFORM_BEFORE_REPORT], evt_Quotations_beforePrint);

//---<客户报价_监听子表批量导入事件，以提高代码运行效率>
function evt_Quotations_Batchmode(obj) {
    var self = obj.form;
    if (self.moduleName == "客户报价") {
        if (obj.key == 'Batch_Items' || obj.key == '产品资料') {
            console.error('obj.key:'+obj.key);
            VLIB.cxRightUnitSUM(self, '产品资料', '报价数量', '计量单位', '数量合计', 'L');
            VLIB.cxRightUnitSUM(self, '产品资料', '箱数', '外箱单位', '箱数合计', 'L');
            fnQuotations_PurchTotal_Rebates(self); //退税总额、采购合计
        }
    }
};
addListener([EVT_RECORDSET_TABLE_ENABLE], evt_Quotations_Batchmode);