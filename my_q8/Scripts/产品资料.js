// 源码阅读第一章 2019.6.4
//---<产品资料_产品组成>
var fnItemConstruction = function (self) {
    if (self.area) {
        if (self.recordSet.fieldByName('产品组成').val() != '成品' && self.recordSet.fieldByName('产品组成').val() != '配件') {
            self.area('产品组成').show();
        } else {
            self.area('产品组成').hide();
        }
    }
};

function evt_Items_Construction(obj) {
    var self = obj.form;
    if (self.moduleName == '产品资料') {
        fnItemConstruction(self);
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], evt_Items_Construction);

function cge_RecordSet_Items(obj) {
    var self = obj.form;
    var cgeField = obj.field;
    if (self.moduleName == '产品资料') {
        //---<产品资料_产品组成>
        if (cgeField.fullName == '产品资料.产品组成') {
            fnItemConstruction(self);
        }

        //---<产品资料_中文规格>
        if (cgeField.fullName == '产品资料.中文规格') {
            if (!self.recordSet.fieldByName('英文规格').val()) {
                self.recordSet.fieldByName('英文规格').val(self.recordSet.fieldByName('中文规格').val());
            }
        }

        //---<产品资料_计算尺柜装量>
        var aFullName = ['产品资料.工厂报价.外箱装量', '产品资料.工厂报价.外箱体积'];
        if ($.inArray(cgeField.fullName, aFullName) != -1) {
            var fResult;
            var fnGetContainerVolume = function (sContainerName) {
                var oTxt = {
                    "values": {
                        "sContainerName": sContainerName
                    }
                }
                var oSQL = _.db.execute('Items_Select_Dic_Container', oTxt);
                if (oSQL.length > 0) {
                    fResult = _.convert.toFloat(oSQL[0].Volume);
                } else {
                    switch (sContainerName) {
                        case '20尺柜':
                            fResult = 28;
                            break;
                        case '40尺柜':
                            fResult = 58;
                            break;
                        case '40尺高柜':
                            fResult = 68;
                            break;
                        default:
                            fResult = 0;
                    }
                }
                if (fResult) {
                    return fResult;
                }
            };
            if (self.recordSet.fieldByName('工厂报价.外箱体积').val() != 0) {
                var Container20 = Math.trunc(fnGetContainerVolume('20尺柜') / self.recordSet.fieldByName('工厂报价.外箱体积').val()) * self.recordSet.fieldByName('工厂报价.外箱装量').val();
                var Container40 = Math.trunc(fnGetContainerVolume('40尺柜') / self.recordSet.fieldByName('工厂报价.外箱体积').val()) * self.recordSet.fieldByName('工厂报价.外箱装量').val();
                var Container40HQ = Math.trunc(fnGetContainerVolume('40尺高柜') / self.recordSet.fieldByName('工厂报价.外箱体积').val()) * self.recordSet.fieldByName('工厂报价.外箱装量').val();
                self.recordSet.fieldByName('工厂报价.20#装量').val(Container20);
                self.recordSet.fieldByName('工厂报价.40#装量').val(Container40);
                self.recordSet.fieldByName('工厂报价.40HQ#装量').val(Container40HQ);
            }
        }
    }
}
addListener([EVT_RECORDSET_AFTER_FIELD_CHANGED], cge_RecordSet_Items);

function btn_Items(obj) {
    var self = obj.form;
    if (self.moduleName == '产品资料') {
        //---<产品资料_给客户推荐产品>
        var fnItems_Recommend = function () {
            try {
                var sModuleName = '产品推荐';
                var oModulePermission = _.app.permission.getModulePermission(sModuleName);
                if (!oModulePermission.new) {
                    _.ui.showWarnning(sModuleName + _.language.get('您没有新建该模块的权限！'));
                    return;
                }
                if (self.type == 'edit') {
                    var sItemNo = self.recordSet.fieldByName('产品编号').val();
                    _.app.ui.openEditor('new', '产品推荐', '', function (oEditor) {
                        _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>' + _.language.get("正在导入数据，请等待！"), function () {
                            var oTable = oEditor.recordSet.tableByName('产品资料');
                            oTable.append();
                            oEditor.recordSet.fieldByName('产品资料.产品编号').val(sItemNo);
                            _.ui.closeWatting();
                        });
                    });
                } else if (self.type == 'search') {
                    var aSelectRows = self.recordCart;
                    if (aSelectRows.length == 0) {
                        _.ui.showWarnning(_.language.get('未选中记录！'));
                        return;
                    }
                    var sCondition = '"' + aSelectRows.join('","') + '"'; //将数组转换并拼接查询rid条件
                    var aItemValue = _.db.execute('Items_Select _Items_ItemNos', {
                        "values": {
                            "srids": sCondition
                        }
                    });
                    if (aItemValue.length > 0) {
                        _.app.ui.openEditor('new', '产品推荐', '', function (oEditor) {
                            _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i><span class="text"></span>', function (el) {
                                var oTable = oEditor.recordSet.tableByName('产品资料');
                                oTable.disableControl();
                                el.css("width", "220px!important");
                                el.css("line-height", "20px");
                                _.utils.processQueue(aItemValue, function (idx, element) {
                                    oTable.append();
                                    oEditor.recordSet.fieldByName('产品资料.产品编号').val(element["ItemNo"]);
                                    el.find(".text").html(_.language.get("正在操作") + '！<br/>(' + _.language.get("第") + idx + _.language.get("条") + '，' + _.language.get("共") + aItemValue.length + _.language.get("条") + '！)');
                                }, function () {
                                    oTable.enableControl('Batch_Items4');
                                    _.ui.closeWatting();
                                });
                            });
                        });
                    }
                }
            } catch (err) {
                _.log.error('给客户推荐产品发生错误！');
            }
        };

        //---<产品资料_给客户报价>
        var fnItems_Quotation = function () {
            try {
                var sModuleName = '客户报价';
                var oModulePermission = _.app.permission.getModulePermission(sModuleName);
                if (!oModulePermission.new) {
                    _.ui.showWarnning(sModuleName + _.language.get('您没有新建该模块的权限！'));
                    return;
                }
                if (self.type == 'edit') {
                    var sItemNo = self.recordSet.fieldByName('产品编号').val();
                    _.app.ui.openEditor('new', '客户报价', '', function (oEditor) {
                        _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>' + _.language.get("正在导入数据，请等待！"), function () {
                            var oTable = oEditor.recordSet.tableByName('产品资料');
                            oTable.append();
                            oEditor.recordSet.fieldByName('产品资料.产品编号').val(sItemNo);
                            _.ui.closeWatting();
                        });
                    });
                } else if (self.type == 'search') {
                    var aSelectRows = self.recordCart;
                    if (aSelectRows.length == 0) {
                        _.ui.showWarnning(_.language.get('未选中记录！'));
                        return;
                    }
                    var sCondition = '"' + aSelectRows.join('","') + '"'; //将数组转换并拼接查询rid条件
                    var aItemValue = _.db.execute('Items_Select _Items_ItemNos', {
                        "values": {
                            "srids": sCondition
                        }
                    });
                    if (aItemValue.length > 0) {
                        _.app.ui.openEditor('new', '客户报价', '', function (oEditor) {
                            _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i><span class="text"></span>', function (el) {
                                var oTable = oEditor.recordSet.tableByName('产品资料');
                                oTable.disableControl();
                                el.css("width", "220px!important");
                                el.css("line-height", "20px");
                                _.utils.processQueue(aItemValue, function (idx, element) {
                                    oTable.append();
                                    oEditor.recordSet.fieldByName('产品资料.产品编号').val(element["ItemNo"]);
                                    el.find(".text").html(_.language.get("正在操作") + '！<br/>(' + _.language.get("第") + idx + _.language.get("条") + '，' + _.language.get("共") + aItemValue.length + _.language.get("条") + '！)');
                                }, function () {
                                    _.ui.closeWatting();
                                    oTable.enableControl('Batch_Items');
                                });
                            });
                        });
                    }
                }
            } catch (err) {
                _.log.error('给客户报价发生错误！');
            }
        };

        //---<产品资料_给客户做销售合同>
        var fnItems_SalesOrder = function () {
            try {
                var sModuleName = '销售合同';
                var oModulePermission = _.app.permission.getModulePermission(sModuleName);
                if (!oModulePermission.new) {
                    _.ui.showWarnning(sModuleName + _.language.get('您没有新建该模块的权限！'));
                    return;
                }
                if (self.type == 'edit') {
                    var sItemNo = self.recordSet.fieldByName('产品编号').val();
                    _.app.ui.openEditor('new', '销售合同', '', function (oEditor) {
                        _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>' + _.language.get("正在导入数据，请等待！"), function () {
                            var oTable = oEditor.recordSet.tableByName('产品资料');
                            oTable.append();
                            oEditor.recordSet.fieldByName('产品资料.产品编号').val(sItemNo);
                            _.ui.closeWatting();
                        });
                    });
                } else if (self.type == 'search') {
                    var aSelectRows = self.recordCart;
                    if (aSelectRows.length == 0) {
                        _.ui.showWarnning(_.language.get('未选中记录！'));
                        return;
                    }
                    var sCondition = '"' + aSelectRows.join('","') + '"'; //将数组转换并拼接查询rid条件
                    var aItemValue = _.db.execute('Items_Select _Items_ItemNos', {
                        "values": {
                            "srids": sCondition
                        }
                    });
                    if (aItemValue.length > 0) {
                        _.app.ui.openEditor('new', '销售合同', '', function (oEditor) {
                            _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i><span class="text"></span>', function (el) {
                                var oTable = oEditor.recordSet.tableByName('产品资料');
                                oTable.disableControl(); //禁用子表合计，提高载入效率
                                el.css("width", "220px!important");
                                el.css("line-height", "20px");
                                _.utils.processQueue(aItemValue, function (idx, element) {
                                    oTable.append();
                                    oEditor.recordSet.fieldByName('产品资料.产品编号').val(element["ItemNo"]);
                                    el.find(".text").html(_.language.get("正在操作") + '！<br/>(' + _.language.get("第") + idx + _.language.get("条") + '，' + _.language.get("共") + aItemValue.length + _.language.get("条") + '！)');
                                }, function () {
                                    _.ui.closeWatting();
                                    oTable.enableControl('Batch_Items2'); //启用子表合计
                                });
                            });
                        });
                    }
                }
            } catch (err) {
                _.log.error('给客户做销售合同发生错误！');
            }
        };

        //---<产品资料_新建工厂资料>
        var fnItems_NewCustomer = function () {
            var sSupplierShortName = self.recordSet.fieldByName('工厂报价.厂商简称').val();
            var oSQL = _.db.execute('Items_Select_SupplierShortName', {
                "values": {
                    "sSupplierShortName": sSupplierShortName
                }
            });
            if (oSQL.length > 0) {
                _.ui.showWarnning('[' + oSQL[0].sModule + ']/' + oSQL[0].SupplierNo + ':' + _.language.get('该客商已建档！'));
            } else {
                _.app.ui.createEditor({
                    moduleName: "工厂资料",
                    onInit: function (oEditor) {
                        oEditor.recordSet.fieldByName('厂商编号').val(self.recordSet.fieldByName('工厂报价.厂商编号').val());
                        oEditor.recordSet.fieldByName('厂商简称').val(sSupplierShortName);
                        oEditor.save(false, function (oRecord) {
                            if (oRecord) {
                                if (self.recordSet.fieldByName('工厂报价.厂商编号').val() != oRecord.recordSet.fieldByName('厂商编号').val()) {
                                    self.recordSet.fieldByName('工厂报价.厂商编号').val(oRecord.recordSet.fieldByName('厂商编号').val());
                                }
                                _.ui.yesOrNo(
                                    _.language.get('[工厂资料]新建成功，是否进一步完善其他信息？'),
                                    okfunc = function () {
                                        _.app.ui.openEditor('edit', '工厂资料', oRecord.recordSet.fieldByName('rid').val()); //可以打开记录
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

        //---<产品资料_样本册>
        var fnItems_SampleBook = function () {
            var aRids = self.recordCart;
            if (aRids.length == 0) {
                _.ui.showWarnning(_.language.get('未选中记录！'));
                return;
            }
            var aElment = {};
            aElment['rids'] = aRids;
            aElment['filename'] = _.language.get('样本册');
            _.net.formDownLoad('/intersky/report_samplebook', aElment);
        }

        if (self.addButton) {
            self.addButton("bExtend", _.language.get("扩展"), "", "yelp", true, true); //下拉菜单
            self.button('bExtend').addButton("bRecommend", _.language.get("给客户推荐产品"), function () {
                fnItems_Recommend();
            });
            self.button('bExtend').addButton("bQuotation", _.language.get("给客户报价"), function () {
                fnItems_Quotation();
            });
            self.button('bExtend').addButton("bSalesOrder", _.language.get("给客户做合同"), function () {
                fnItems_SalesOrder();
            });
            if (obj.evtID == EVT_EDITFORM_CREATED) {
                self.area('工厂报价').addButton("bSheetExtend", _.language.get("扩展"), "", "yelp", true, true);
                self.area('工厂报价').button('bSheetExtend').addButton("bItemsNewItems", _.language.get("新建工厂资料"), function () {
                    fnItems_NewCustomer();
                });
            }
            if (obj.evtID == EVT_SEARCHFORM_CREATED) {
                self.button('bExtend').addButton("bSampleBook", _.language.get("打印样本册"), function () {
                    fnItems_SampleBook();
                });
            }
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY, EVT_SEARCHFORM_CREATED], btn_Items);

//---<产品资料_BeaforeSave>
function evt_Items_Beforesave(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == '产品资料') {
            if (self.field) {
                var fnCanSplit = function (sItemNO, sRoad) {
                    var isResult;
                    var oTxt = {
                        "values": {
                            "sItemNO": sItemNO
                        }
                    }
                    var oSQL = _.db.execute('Items_Select_ItemsConstruction_Items', oTxt);
                    if (oSQL.length > 0) {
                        isResult = false;
                    } else {
                        for (var i = 0; i < oSQL.length; i++) {
                            if (bIsCan) {
                                if (oSQL[i].ItemNO == sSourceItemNo) {
                                    sWrongRoad = sRoad;
                                    bIsCan = false;
                                } else {
                                    if (!fnCanSplit(oSQL[i].ItemNO, sRoad + '\\' + oSQL[i].ItemNO)) {
                                        isResult = false;
                                    }
                                }
                            }
                        }
                        isResult = true;
                    }
                    if (isResult) {
                        return true;
                    } else {
                        return false;
                    }
                };
                var fnMath = function (bDoneResult) {
                    if (self.recordSet.fieldByName('产品组成').val() != '组成') {
                        if (self.recordSet.tableByName('工厂报价').recordCount() == 0 && self.field) {
                            _.ui.showWarnning(_.language.get('子表不能为空!'));
                            reject('子表不能为空!');
                        } else {
                            if (self.recordSet.fieldByName('采购单价').val() == 0) {
                                self.recordSet.tableByName('工厂报价').cursor(0, true);
                                self.recordSet.fieldByName('采购单价').val(self.recordSet.fieldByName('工厂报价.采购单价').val());
                                self.recordSet.fieldByName('计量单位').val(self.recordSet.fieldByName('工厂报价.计量单位').val());
                            }
                            bDoneResult(true);
                        }
                    } else {
                        fTotal = 0;
                        bIsCan = true;
                        sWrongRoad = '';
                        sSourceItemNo = self.recordSet.fieldByName('产品编号').val();
                        var oTable = self.recordSet.tableByName('产品组成');
                        oTable.disableControl();
                        var iBookMark = oTable.cursor();
                        oTable.cursor(0, false);
                        try {
                            oTable.down(function () {
                                if (bIsCan) {
                                    if (self.recordSet.fieldByName('产品组成.产品编号').val() == self.recordSet.fieldByName('产品编号').val()) {
                                        bIsCan = false;
                                    }
                                    if (bIsCan) {
                                        fnCanSplit(self.recordSet.fieldByName('产品组成.产品编号').val(), self.recordSet.fieldByName('产品组成.产品编号').val());
                                        fTotal = fTotal + self.recordSet.fieldByName('产品组成.采购单价').val() * self.recordSet.fieldByName('产品组成.汇率').val() * self.recordSet.fieldByName('产品组成.组成用量').val();
                                    }
                                }

                            });
                        } finally {
                            oTable.cursor(iBookMark, true);
                            oTable.enableControl('Batch_Items3');
                        }
                        if (!bIsCan && self.field) {
                            _.ui.showWarnning(_.language.get('操作死循环:产品编号不能出现在其产品组成或子系产品组成中！') + '\n' + sWrongRoad);
                            return reject('操作死循环:产品编号不能出现在其产品组成或子系产品组成中！');
                        } else {
                            self.recordSet.fieldByName('采购单价').val(fTotal);
                            bDoneResult(true);
                        }
                    }
                };

                var fTotal, bIsCan, sWrongRoad, sSourceItemNo;
                var oTable = self.recordSet.tableByName('产品组成');
                var frecordCount = oTable.recordCount();
                if (self.recordSet.fieldByName('产品组成').val() == '成品' || self.recordSet.fieldByName('产品组成').val() == '配件') {
                    if (frecordCount > 0) {
                        if (self.field) {
                            _.ui.yesOrNo(
                                _.language.get('“产品组成”为非套装产品，系统将清空子表产品组成中的数据.确定执行?'),
                                okfunc = function () {
                                    oTable.clear();
                                    reject('“产品组成”为非套装产品，系统将清空子表产品组成中的数据.确定执行?');
                                },
                                cancelfunc = function () {
                                    fnMath(function (res) {
                                        if (res == true) {
                                            resolve();
                                        }
                                    }); //采购单价计算
                                }
                            );
                        } else {
                            fnMath(function (res) {
                                if (res == true) {
                                    resolve();
                                }
                            });
                        }
                    } else {
                        fnMath(function (res) {
                            if (res == true) {
                                resolve();
                            }
                        }); //采购单价计算
                    }
                } else {
                    if (frecordCount == 0) {
                        self.recordSet.fieldByName('产品组成').val('成品');
                    }
                    fnMath(function (res) {
                        if (res == true) {
                            resolve();
                        }
                    });
                }
            } else {
                resolve();
            }
        } else {
            resolve();
        }
    });
}
addPromiseListener([EVT_RECORDSET_BEFORE_SAVE], evt_Items_Beforesave);

//---<产品资料_EditorDrawCell>
function evt_Items_EditorDrawCell(obj) {
    var self = obj.form;
    if (self.moduleName == '产品资料') {
        var oTable = self.recordSet.tableByName('工厂报价');
        var fPurchasePrice = self.recordSet.fieldByName('采购单价').val();
        var fnItems_EditorDrawCell = function (idx) {
            var fSheetPurchasePrice = oTable.indexVal(idx, '工厂报价.采购单价');
            if (fSheetPurchasePrice <= 0) {
                oTable.setStyle({
                    rowStyle: {
                        background: "yellow"
                    }
                }, "_wholerow", idx); //当采购单价<=0，整条子表背景显示黄色
            } else if (fSheetPurchasePrice > 0 && fSheetPurchasePrice < fPurchasePrice) {
                oTable.setStyle({
                    rowStyle: VLIB.defultstyle
                }, "_wholerow", idx);
                oTable.setStyle({
                    style: {
                        background: "red"
                    }
                }, '产品资料.工厂报价.采购单价', idx); //当采购单价>0且小于主表采购单价，采购单价背景显示红色
            } else {
                oTable.setStyle({
                    rowStyle: VLIB.defultstyle
                }, "_wholerow", idx);
                oTable.setStyle({
                    style: VLIB.defultstyle
                }, '产品资料.工厂报价.采购单价', idx);
            }
        };
        if (obj.rEvent == EVT_FIELD_CHANGED && obj.field.fullName == '产品资料.工厂报价.采购单价') {
            fnItems_EditorDrawCell(oTable.cursor());
        }
        if (obj.rEvent == EVT_TABLE_CHILD_NEW && obj.table.name == '工厂报价') {
            fnItems_EditorDrawCell(oTable.cursor());
        }
        if (obj.rEvent == EVT_SYNC_TABLEDATA) {
            for (var i in obj.table.data) {
                fnItems_EditorDrawCell(i);
            }
        }
        if (obj.rEvent == EVT_FIELD_CHANGED && obj.field.fullName == '产品资料.采购单价') {
            var iRecordCount = obj.form.recordSet.tableByName('工厂报价').recordCount();
            if (iRecordCount > 0) {
                for (var i = 0; i < iRecordCount; i++) {
                    fnItems_EditorDrawCell(i);
                }
            }
        }
    }
}
addListener([EVT_EDITFORM_GET_STYLE], evt_Items_EditorDrawCell);

//---<产品资料_SearchDrawCell>
function evt_Items_SearchDrawCell(obj) {
    var self = obj.form;
    if (self.moduleName == '产品资料') {
        var aRow = [];
        var aSafeStore = self.grid.getColumn('安全库存'); // 获取安全库存整列值
        var aStore = self.grid.getColumn('库存数量');
        // 循环比较，将符合条件的行号放入数组aRow
        for (var i in aSafeStore) {
            var fSafeStore = _.convert.toFloat(aSafeStore[i].value);
            var fStore = _.convert.toFloat(aStore[i].value);
            if (fSafeStore - fStore > 0) {
                aRow.push(_.convert.toFloat(i) + 1);
            }
        }
        // 设置样式
        if (aRow.length > 0) {
            for (var i in aRow) {
                self.grid.setRow({}, {
                    background: "#ff6f92"
                }, aRow[i]);
            }
        }
    }
}
addListener([EVT_SEARCHFORM_SEARCH_COMPLETE], evt_Items_SearchDrawCell);

//---<产品资料_记录复制>
function evt_Items_aftercopy(obj) {
    var self = obj.form;
    if (self.moduleName == "产品资料") {
        self.recordSet.fieldByName('库存数量').val(0);
        self.recordSet.fieldByName('开发时间').val((new Date()).Format("yyyy-MM-dd hh:mm:ss"));
        self.recordSet.fieldByName('最近推荐').val('');
        self.recordSet.fieldByName('最近寄样').val('');
        self.recordSet.fieldByName('最近报价').val('');
        self.recordSet.fieldByName('最近成交').val('');
        self.recordSet.fieldByName('成交总额').val(0);
        self.recordSet.fieldByName('成交总量').val(0);
    }
}
addListener([EVT_RECORDSET_AFTER_COPY], evt_Items_aftercopy);