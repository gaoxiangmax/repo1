//---<销售合同_采购及退税>
var fnSalesOrders_PurchTotal_Rebates = function (self) {
    try {
        if (self.recordSet.fieldByName('客户编号').val().length == 0) {
            return;
        }
        var oSQL = _.db.execute('SalesOrders_Select_Customers', {
            "values": {
                "sCustomerNo": self.recordSet.fieldByName('客户编号').val()
            }
        });
        if (oSQL.length > 0) {
            VLIB.cxPurchTotal(self, '产品资料', _.convert.toBoolean(oSQL[0].IsEXW));
        } else {
            VLIB.cxPurchTotal(self, '产品资料', false);
        }
    } catch (err) {
        _.log.error('计算采购及退税错误！');
    }
};

function btn_SalesOrders(obj) {
    var self = obj.form;
    if (self.moduleName == '销售合同') {
        //---<销售合同_自动生成采购计划>
        var fnSalesOrders_AutoPurchasePlans = function () {
            if (self.modified) {
                _.ui.showWarnning(_.language.get('记录未保存，系统停止操作！'));
                return;
            }
            var sRid = self.rid;
            var iSuccess = 0;
            var oTxt = {
                "values": {
                    "srid": sRid,
                }
            }
            var oSQL = _.db.execute('SalesOrders_Select_SalesOrders', oTxt);

            //---判断已作废的合同阻止生成采购计划
            if (oSQL[0].SalesOrderStatus == '已作废') {
                _.ui.showWarnning(_.language.get('合同已作废，系统中止操作！'));
                return;
            }

            //---判断审批通过才能生成采购计划
            var sSalesOrderNo = oSQL[0].SalesOrderNo;
            try {
                if (window.aconfig && window.aconfig.SalesOrder_ToPurWorkFlowCheck) {
                    if (VLIB.cxCheckWorkflowState('销售合同', sRid) > 0) {
                        iSuccess++;
                    }
                } else {
                    if (window.aconfig && !window.aconfig.SalesOrder_ToPurWorkFlowCheck) {
                        iSuccess++;
                    }
                }
            } catch (err) {
                _.log.error('扫描审批导致操作失败！');
            }

            //---判断有定金且已收定金>0才能生成采购计划
            try {
                var bDepositOrNot = oSQL[0].DepositOrNot;
                var sDownPayment = oSQL[0].DownPayment;
                if (window.aconfig && window.aconfig.SalesOrder_ToDownPaymentCheck) {
                    if (bDepositOrNot) {
                        if (sDownPayment > 0) {
                            iSuccess = iSuccess + 2;
                        }
                    } else {
                        iSuccess = iSuccess + 2;
                    }
                } else {
                    if (window.aconfig && !window.aconfig.SalesOrder_ToDownPaymentCheck) {
                        iSuccess = iSuccess + 2;
                    }
                }
            } catch (err) {
                _.log.error('扫描定金导致操作失败！');
            }

            //---ASuccess等于3时，满足生成采购计划条件
            var bAutomatic;
            if (iSuccess == 3) {
                if (window.aconfig && window.aconfig.SalesOrders_AutoNoCheck) {
                    var bAutomatic = true;
                } else {
                    bAutomatic = false;
                }
                VLIB.cxAutoData(self, sRid, '销售合同.销售合同', '采购计划.销售合同', '', '', '采购计划.采购计划', true, bAutomatic, function (res) {
                    if (res == true && window.aconfig && !window.aconfig.SalesOrder_UpdatePurchasePlansUserCheck) {
                        var oSQL = _.db.execute('SalesOrders_Select_Sys_User', {});
                        var aUserName = [];
                        for (var i in oSQL) {
                            aUserName.push(oSQL[i].username);
                        }
                        _.ui.showInput({
                            title: _.language.get("请选择将生成的[采购计划]交接的人员："),
                            type: "dropdown",
                            value: "", //默认值
                            fields: aUserName,
                            onapprove: function (val) {
                                if (val) {
                                    var oTxt = {
                                        "values": {
                                            "sSalesOrderNo": sSalesOrderNo,
                                            "sUserID": _.app.cxUserInfo(val).recordID
                                        }
                                    }
                                    _.db.execute('SalesOrders_Update_PurchasePlans', oTxt);
                                }
                            }
                        });
                    }
                });
            } else {
                switch (iSuccess) {
                    case 0:
                        _.ui.showWarnning(_.language.get('该合同既未通过审批也未收定金，系统停止操作！'));
                        break;
                    case 1:
                        _.ui.showWarnning(_.language.get('该合同未收定金，系统停止操作！'));
                        break;
                    case 2:
                        _.ui.showWarnning(_.language.get('该合同未通过审批，系统停止操作！'));
                        break;
                }
            }
        }

        //---<销售合同_新建利润核算>
        var fnSalesOrders_ProfitAccounting = function () {
            try {
                var sTargetMouleName = '利润核算';
                var oModulePermission = _.app.permission.getModulePermission(sTargetMouleName);
                if (!oModulePermission.new) {
                    _.ui.showWarnning('[' + sTargetMouleName + ']:' + _.language.get('您没有新建该模块的权限！'));
                    return;
                }
                sKeyNo = self.recordSet.fieldByName('销售合同').val();
                var oSQL = _.db.execute('SalesOrders_Select_ProfitAccounting', {
                    "values": {
                        "sKeyNo": sKeyNo
                    }
                });
                if (oSQL.length > 0) {
                    _.ui.showWarnning(_.language.get('该合同已经做过核算，系统中止操作！'));
                } else {
                    _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>' + _.language.get('正在操作') + '！', function () {
                        _.app.ui.createEditor({
                            moduleName: "利润核算",
                            onInit: function (oEditor) {
                                oEditor.recordSet.fieldByName('核算类别').val('订单核算');
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
                }
            } catch (err) {
                _.log.error('新建利润核算发生错误！');
            }
        };

        //---<销售合同_新建产品推荐>
        var fnSalesOrders_Recommend = function () {
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
                    oTable.enableControl('Batch_SalesOrders');
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
                            oTable.enableControl('Batch_SalesOrders2');
                            _.ui.closeWatting();
                        });
                    });
                });
            } catch (err) {
                _.log.error('新建产品推荐发生错误！');
            }
        };

        //---<销售合同_新建客户资料>
        var fnSalesOrders_NewCustomer = function () {
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

        //---<销售合同_新建产品资料>
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

        //---<销售合同_条码输入>
        var fnSalesOrders_BarcodeInput = function () {
            _.app.ui.showModal({
                'id': "Quotations_BarcodeInput",
                'width': 300,
                'height': 160,
                'closable': false,
                'header': "条码输入",
                'html': '<div style="height:100%;padding:10px">\
                            <div class="row ui input" style="width:100%;margin-bottom:10px"><label style="margin-right:10px;line-height:32px">条码</label><input type="text" id="fBarcode">\
                            </div>\
                            <div class="row ui input" style="width:100%"><label style="margin-right:10px;line-height:32px">数量</label><input type="text" id="fQty">\
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
                            self.recordSet.fieldByName('产品资料.合同数量').val($("#fQty").val());
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
            self.button('bExtend').addButton("bSalesOrdersAutoPurchasePlans", _.language.get("自动生成采购计划"), function () {
                fnSalesOrders_AutoPurchasePlans();
            });

            if (obj.evtID == EVT_EDITFORM_CREATED) {
                // self.button('bExtend').addButton("bSalesOrders_AddProductToPurchasePlan", "追加产品至采购计划", function () {
                //     fnSalesOrders_AddProductToPurchasePlan(self);
                // });
                self.button('bExtend').addButton("bSalesOrdersProfitAccounting", _.language.get("新建利润核算"), function () {
                    fnSalesOrders_ProfitAccounting();
                });

                self.button('bExtend').addButton("bSalesOrdersRecommend", _.language.get("给客户推荐产品"), function () {
                    fnSalesOrders_Recommend();
                });

                self.button('bExtend').addButton("bSalesOrdersCustomers", _.language.get("新建客户资料"), function () {
                    fnSalesOrders_NewCustomer();
                });

                self.area('产品资料').addButton("bSheetExtend", _.language.get("扩展"), "", "yelp", true, true);
                self.area('产品资料').button('bSheetExtend').addButton("bNewItems", _.language.get("新建产品资料"), function () {
                    fnQuotations_NewItems();
                });
                self.area('产品资料').addButton("bSalesOrdersBarcodeInput", _.language.get("条码输入"), function () {
                    fnSalesOrders_BarcodeInput();
                }, "barcode", false, true);
            }

            self.addButton("bSalesOrderStatus", _.language.get("合同状态"), "", "bookmark icon", true, true); //下拉菜单
            self.button("bSalesOrderStatus").addButton("bCancel", '<a class="ui orange label">' + _.language.get('合同作废') + '</a>', function () {
                var oSQL = _.db.execute('SalesOrders_Select_PurchasePlans', {
                    "values": {
                        "srid": self.rid
                    }
                });
                if (oSQL.length > 0) {
                    _.ui.showWarnning(_.language.get('系统检测该合同已将数据流转至[采购计划]，中止操作！'));
                } else {
                    VLIB.Status(self, '销售合同', 'SalesOrders', '合同状态', 'SalesOrderStatus', '已作废');
                }
            });
            self.button("bSalesOrderStatus").addButton("bTobeConfirmed", '<a class="ui olive label">' + _.language.get('合同待确认') + '</a>', function () {
                VLIB.Status(self, '销售合同', 'SalesOrders', '合同状态', 'SalesOrderStatus', '待确认');
            });
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY, EVT_SEARCHFORM_CREATED], btn_SalesOrders);

//---<mcTableDelete子表删除前>
function evt_SalesOrders_tableDeleteItems(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (obj.table && self.moduleName == '销售合同' && obj.table.name == '产品资料') {
            // 单独删除
            var fnSalesOrdersLineSingleDelete = function (srid) {
                var sRecordID = srid;
                var sModule = '';
                if (!sRecordID) {
                    return reject();
                } else {
                    var oSQL = _.db.execute('SalesOrders_Select_PurchasePlansLine', {
                        "values": {
                            "sSOL_RecordID": sRecordID
                        }
                    });
                    if (oSQL.length > 0) {
                        sModule = '采购计划';
                    }
                    var oSQL = _.db.execute('SalesOrders_Select_PurchaseOrdersLine', {
                        "values": {
                            "sSOL_RecordID": sRecordID
                        }
                    });
                    if (oSQL.length > 0) {
                        if (sModule) {
                            sModule = sModule + ',' + '采购合同';
                        } else {
                            sModule = '采购合同';
                        }
                    }
                    if (sModule.length > 0) {
                        _.ui.showWarnning(_.language.get('系统中止删除操作，因为该产品数据已流向') + sModule + '!');
                        reject();
                    } else {
                        resolve();
                    }
                }
            };

            // 勾选删除
            var fnSalesOrdersLineMassDelete = function (oDelecteDetailData) {
                var oDetailData = oDelecteDetailData;
                var aParams = [];
                for (var i in oDetailData) {
                    var srid = oDetailData[i].rid; //数据集中的rid因增改会在rid前加+或*，因此需要对rid做特殊处理
                    var iSite = srid.indexOf('+');
                    srid = srid.substr(iSite + 1);
                    iSite = srid.indexOf('*'); //处理*
                    srid = srid.substr(iSite + 1);
                    var oTxt1 = {
                        "values": {
                            "sModule": 'PurchasePlansLine',
                            "sSOL_RecordID": srid
                        }
                    };
                    aParams.push(oTxt1);
                    var oTxt2 = {
                        "values": {
                            "sModule": 'PurchaseOrdersLine',
                            "sSOL_RecordID": srid
                        }
                    };
                    aParams.push(oTxt2);
                }
                //批量提交被勾选删除的记录在采购计划或采购合同是否存在
                var oSQL = _.db.execute('SalesOrders_Select_PurchasePlansOrderLine', aParams);
                var isExist = 0;
                for (var i in oSQL) {
                    if (oSQL[i].length > 0) {
                        isExist++;
                        break;
                    }
                }
                if (isExist > 0) {
                    var sModule = '采购计划或采购合同'
                    _.ui.showWarnning(_.language.get('系统中止删除操作，因为该产品数据已流向') + sModule + '!');
                    reject();
                } else {
                    resolve();
                }
            }

            // deleteDone=true表示子表为当前选中记录删除，false表示勾选删除
            if (obj.deleteDone == true) {
                fnSalesOrdersLineSingleDelete(self.recordSet.fieldByName('产品资料.rid').val());
            } else if (obj.deleteDone == false) {
                var oDelecteDetailData = obj.selectsData; //被勾选删除的子表数据集
                fnSalesOrdersLineMassDelete(oDelecteDetailData);
            }
        } else {
            resolve();
        }
    });
};
addPromiseListener([EVT_RECORDSET_BEFORE_CHILD_DELETE], evt_SalesOrders_tableDeleteItems);

//---<mcSave_copy记录复制后>
function evt_SalesOrders_saveCopy(obj) {
    var self = obj.form;
    if (self.moduleName == '销售合同') {
        if (self.recordJob == 'copy') {
            self.recordSet.fieldByName('费用标识').val([]); //空值   
            self.recordSet.fieldByName('已收定金').val([]); //空值 
            self.recordSet.fieldByName('定金日期').val([]); //空值 
            oTable = self.recordSet.tableByName("产品资料");
            oTable.disableControl(); //禁用子表对象，提高游标循环效率
            var iBookMark = oTable.cursor(); //获取当前焦点记录游标
            oTable.cursor(0, false);
            try {
                oTable.down(function () {
                    self.recordSet.fieldByName('产品资料.余货不发').val('否');
                    self.recordSet.fieldByName('产品资料.下单数量').val(0);
                    self.recordSet.fieldByName('产品资料.计划数量').val(0);
                    self.recordSet.fieldByName('产品资料.出货数量').val(0);
                }); //down是从上往下滚，up是从下往上滚；
            } finally {
                oTable.cursor(iBookMark, true); //回滚至初始焦点记录
                oTable.enableControl('Batch_SalesOrders3'); //释放子表对象
            }
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], evt_SalesOrders_saveCopy);

function evt_SalesOrders_EnableShow(obj) {
    var self = obj.form;
    if (self.moduleName == '销售合同') {
        //---定金显示
        if (self.recordSet.fieldByName('有无定金').val()) {
            if (self.field) {
                self.field('定金日期').show();
                self.field('已收定金').show();
            }
        } else {
            if (self.field) {
                self.field('定金日期').hide();
                self.field('已收定金').hide();
            }
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], evt_SalesOrders_EnableShow);

//---<销售合同_产品资料交货日期>
function evt_SalesOrders_DeliveryDate(obj) {
    var self = obj.form;
    if (self.moduleName == '销售合同') {
        if (obj.table.name == '产品资料') {
            var dDeliveryDate = self.recordSet.fieldByName('交货日期').val();
            if (dDeliveryDate) {
                self.recordSet.fieldByName('产品资料.交货日期').val(dDeliveryDate);
            }
        }
    }
}
addListener([EVT_RECORDSET_AFTER_CHILD_NEW, EVT_RECORDSET_AFTER_CHILD_COPY, EVT_RECORDSET_AFTER_CHILD_INSERT], evt_SalesOrders_DeliveryDate);

//---<销售合同_数量合计_箱数合计_退税总额_采购合计>
function evt_SalesOrders_QTYTotal(obj) {
    var self = obj.form;
    if (self.moduleName == '销售合同') {
        if (obj.table.name == '产品资料') {
            if (!obj.table.disabled()) {
                VLIB.cxRightUnitSUM(self, '产品资料', '合同数量', '计量单位', '数量合计', 'L'); //数量合计
                VLIB.cxRightUnitSUM(self, '产品资料', '箱数', '外箱单位', '箱数合计', 'L', false); //箱数合计
                fnSalesOrders_PurchTotal_Rebates(self); //退税总额、采购合计
            }
        }
    }
}
addListener([EVT_RECORDSET_AFTER_CHILD_NEW, EVT_RECORDSET_AFTER_CHILD_COPY, EVT_RECORDSET_AFTER_CHILD_INSERT, EVT_RECORDSET_AFTER_CHILD_DELETE], evt_SalesOrders_QTYTotal);

function cge_RecordSet_SalesOrders(obj) {
    var self = obj.form;
    var cgeField = obj.field;
    if (self.moduleName == '销售合同') {
        //---<销售合同_价格条款>
        if (cgeField.fullName == '销售合同.价格条款') {
            VLIB.cxTermOfPrice(obj);
        }

        //---<销售合同_有无定金>
        if (cgeField.fullName == '销售合同.有无定金') {
            if (self.recordSet.fieldByName('有无定金').val()) {
                self.field('定金日期').show();
                self.field('已收定金').show();
            } else {
                self.field('定金日期').hide();
                self.field('已收定金').hide();
            }
        }

        //---<销售合同_生效日期>
        if (cgeField.fullName == '销售合同.合同状态') {
            if (self.recordSet.fieldByName('合同状态').val() == '已生效') {
                self.recordSet.fieldByName('生效日期').val((new Date()).Format("yyyy-MM-dd"));
            }
        }
        //---<销售合同_美金汇率>
        if (cgeField.fullName == '销售合同.销售币种') {
            var oSQL = _.db.execute('SalesOrders_Select_Dic_Currency', {
                "values": {}
            });
            if (oSQL.length > 0) {
                self.recordSet.fieldByName('美金汇率').val(oSQL[0].Rate);
            }
        }
        //---<销售合同_采购及退税>
        var aFullName = ['销售合同.结算类别', '销售合同.价格条款', '销售合同.产品资料.采购总价', '销售合同.产品资料.采购币种', '销售合同.产品资料.退税率', '销售合同.产品资料.增值税率'];
        if (!obj.table.disabled() && $.inArray(cgeField.fullName, aFullName) != -1) {
            fnSalesOrders_PurchTotal_Rebates(self);
        }
        //---<销售合同_产品资料计算美金换算1>
        var aFullName = ['销售合同.汇率', '销售合同.美金汇率'];
        if ($.inArray(cgeField.fullName, aFullName) != -1) {
            var fExchangeRate = self.recordSet.fieldByName('汇率').val();
            var fUSDRate = self.recordSet.fieldByName('美金汇率').val();
            var fSalesAmount = 0;
            var oTable = self.recordSet.tableByName('产品资料');
            oTable.disableControl();
            var iBookMark = oTable.cursor();
            oTable.cursor(0, false);
            try {
                oTable.down(function () {
                    if (fUSDRate > 0) {
                        fSalesAmount = self.recordSet.fieldByName('产品资料.销售总价').val();
                        var fResult = fSalesAmount * fExchangeRate / fUSDRate;
                        self.recordSet.fieldByName('产品资料.美金换算').val(fResult.toFixed(4));
                    }
                });
            } finally {
                oTable.cursor(iBookMark, true);
                oTable.enableControl('Batch_SalesOrders4');
            }
        }
        //---<销售合同_产品资料计算美金换算2>
        if (cgeField.fullName == '销售合同.产品资料.销售总价') {
            var fExchangeRate = self.recordSet.fieldByName('汇率').val();
            var fUSDRate = self.recordSet.fieldByName('美金汇率').val();
            if (fUSDRate > 0) {
                var fSalesAmount = self.recordSet.fieldByName('产品资料.销售总价').val();
            }
            var fResult = fSalesAmount * fExchangeRate / fUSDRate;
            self.recordSet.fieldByName('产品资料.美金换算').val(fResult.toFixed(4));
        }
        //---<销售合同_交货日期批量更新至子表>
        if (cgeField.fullName == '销售合同.交货日期') {
            var iRecords = self.recordSet.tableByName("产品资料").recordCount();
            if (iRecords == 0) {
                return;
            }
            var DeliveryDate = self.recordSet.fieldByName('交货日期').val();
            if (!DeliveryDate) {
                return;
            }
            _.ui.yesOrNo(
                _.language.get('是否同时更新子表的交货日期！'),
                okfunc = function () {
                    var oTable = self.recordSet.tableByName('产品资料');
                    oTable.disableControl();
                    var iBookMark = oTable.cursor();
                    oTable.cursor(0);
                    try {
                        oTable.down(function () {
                            self.recordSet.fieldByName('产品资料.交货日期').val(DeliveryDate);
                        });
                    } finally {
                        oTable.cursor(iBookMark);
                        oTable.enableControl('Batch_SalesOrders5');
                    }
                }
            );
        }
        //---<销售合同_数量合计_箱数合计>
        if (!obj.table.disabled()) {
            var aFullName = ['销售合同.产品资料.合同数量', '销售合同.产品资料.计量单位'];
            if ($.inArray(cgeField.fullName, aFullName) != -1) {
                VLIB.cxRightUnitSUM(self, '产品资料', '合同数量', '计量单位', '数量合计', 'L');
            }
            var aFullName = ['销售合同.产品资料.箱数'];
            if ($.inArray(cgeField.fullName, aFullName) != -1) {
                VLIB.cxRightUnitSUM(self, '产品资料', '箱数', '外箱单位', '箱数合计', 'L', false);
            }
        }
    }
}
addListener([EVT_RECORDSET_AFTER_FIELD_CHANGED], cge_RecordSet_SalesOrders);

//---<销售合同_点击打印前>
function evt_SalesOrders_beforePrint(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == "销售合同") {
            if (VLIB.cxCheckWorkflowState('销售合同', self.rid) > -1 || window.aconfig.SalesOrders_PrintBeforeStartupCheck) {
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
addPromiseListener([EVT_SEARCHFORM_BEFORE_REPORT, EVT_EDITFORM_BEFORE_REPORT], evt_SalesOrders_beforePrint);

//---<销售合同_记录复制>
function evt_SalesOrders_aftercopy(obj) {
    var self = obj.form;
    if (self.moduleName == "销售合同") {
        oTable = self.recordSet.tableByName("产品资料");
        self.recordSet.fieldByName('已收定金').val(0);
        self.recordSet.fieldByName('定金日期').val('');
        self.recordSet.fieldByName('费用标识').val('');
        var iBookMark = oTable.cursor();
        oTable.cursor(0, false);
        try {
            oTable.down(function () {
                self.recordSet.fieldByName('产品资料.下单数量').val(0);
                self.recordSet.fieldByName('产品资料.计划数量').val(0);
                self.recordSet.fieldByName('产品资料.出货数量').val(0);
            }); //down是从上往下滚，up是从下往上滚；
        } finally {
            oTable.cursor(iBookMark, true); //回滚至初始焦点记录
        }
    }
}
addListener([EVT_RECORDSET_AFTER_COPY], evt_SalesOrders_aftercopy);

//---<销售合同_产品资料记录复制>
function evt_SalesOrders_Child_aftercopy(obj) {
    var self = obj.form;
    if (self.moduleName == '销售合同') {
        if (obj.table.name == '产品资料') {
            self.recordSet.fieldByName('产品资料.下单数量').val(0);
            self.recordSet.fieldByName('产品资料.计划数量').val(0);
            self.recordSet.fieldByName('产品资料.出货数量').val(0);
        }
    }
}
addListener([EVT_RECORDSET_AFTER_CHILD_COPY], evt_SalesOrders_Child_aftercopy);

//---<销售合同_监听子表批量导入事件，以提高代码运行效率>
function evt_SalesOrders_Batchmode(obj) {
    var self = obj.form;
    if (self.moduleName == "销售合同") {
        if (obj.key == 'Batch_Items2' || obj.key == '产品资料') {
            VLIB.cxRightUnitSUM(self, '产品资料', '合同数量', '计量单位', '数量合计', 'L'); //数量合计
            VLIB.cxRightUnitSUM(self, '产品资料', '箱数', '外箱单位', '箱数合计', 'L', false); //箱数合计
            fnSalesOrders_PurchTotal_Rebates(self); //退税总额、采购合计
        }
    }
};
addListener([EVT_RECORDSET_TABLE_ENABLE], evt_SalesOrders_Batchmode);