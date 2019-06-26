function btn_ShipingPlans(obj) {
    var self = obj.form;
    if (self.moduleName == '出运计划') {
        //---<出运计划_自动生成出运明细>
        var fnShipingPlans_AutoShipments = function () {
            if (self.type == 'edit') {
                if (self.modified) {
                    _.ui.showWarnning(_.language.get('记录未保存，系统停止操作！'));
                    return;
                }
                var sInvoiceNO = self.recordSet.fieldByName('发票号码').val();
            } else {
                var sInvoiceNO = self.grid.getCell("发票号码", self.grid.rowID());
            }
            var sRid = self.rid;
            var oSQL = _.db.execute('ShipingPlans_Select_Shipments', {
                "values": {
                    "sInvoiceNO": sInvoiceNO
                }
            });
            if (oSQL.length > 0) {
                _.ui.showWarnning(_.language.get('该票对应的出运明细已存在！'));
            } else {
                VLIB.cxAutoData(self, sRid, '出运计划.发票号码', '出运明细.发票号码', '', '', '出运明细.发票号码', true, false, function (res) {
                    if (res == true) {
                        _.db.execute('ShipingPlans_Update_ShipingPlans', {
                            "values": {
                                "srid": sRid
                            }
                        });
                    }
                });
            }
        };

        if (self.addButton) {
            self.addButton("bExtend", _.language.get("扩展"), "", "yelp", true); //下拉菜单
            self.button('bExtend').addButton("bShipingPlansAutoShipments", _.language.get("自动生成出运明细"), function () {
                fnShipingPlans_AutoShipments();
            });
            if (self.type == 'edit') {
                self.area('产品资料').addButton("bItemExtend", _.language.get("扩展"), "", "yelp", true, true); //下拉菜单
                self.area('产品资料').button('bItemExtend').addButton("bShipingPlans_ClearShipingPlansLine", _.language.get("清空产品资料"), function () {
                    self.recordSet.tableByName("产品资料").clear(); //---<出运计划_清空产品资料>
                });
            }
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY, EVT_SEARCHFORM_CREATED], btn_ShipingPlans);

//---<出运计划_数量合计>
function evt_ShipingPlans_QTYTotal(obj) {
    var self = obj.form;
    if (self.moduleName == '出运计划') {
        if (obj.table.name == '产品资料') {
            VLIB.cxRightUnitSUM(self, '产品资料', '出货数量', '计量单位', '数量合计', 'L');
            VLIB.cxRightUnitSUM(self, '产品资料', '箱数', '外箱单位', '箱数合计', 'L');
        }
    }
}
addListener([EVT_RECORDSET_AFTER_CHILD_NEW, EVT_RECORDSET_AFTER_CHILD_COPY, EVT_RECORDSET_AFTER_CHILD_INSERT, EVT_RECORDSET_AFTER_CHILD_DELETE], evt_ShipingPlans_QTYTotal);

function cge_RecordSet_ShipingPlans(obj) {
    var self = obj.form;
    var cgeField = obj.field;
    if (self.moduleName == '出运计划') {
        var aFullName = ['出运计划.产品资料.出货数量', '出运计划.产品资料.计量单位'];
        if ($.inArray(cgeField.fullName, aFullName) != -1) {
            VLIB.cxRightUnitSUM(self, '产品资料', '出货数量', '计量单位', '数量合计', 'L');
        }
        var aFullName = ['出运计划.产品资料.外箱单位', '出运计划.产品资料.箱数'];
        if ($.inArray(cgeField.fullName, aFullName) != -1) {
            VLIB.cxRightUnitSUM(self, '产品资料', '箱数', '外箱单位', '箱数合计', 'L');
        }
        if (cgeField.fullName == '出运计划.预计出运') {
            var sPayLimitDay;
            var oSQL = _.db.execute('ShipingPlans_Select_Customers', {
                "values": {
                    "sCustomerNo": self.recordSet.fieldByName('客户编号').val()
                }
            });
            if (oSQL.length == 0 || _.convert.toFloat(oSQL[0].PayLimitDays) == 0) {
                sPayLimitDay = _.date.incDay((new Date(self.recordSet.fieldByName('预计出运').val())).Format("yyyy-MM-dd"), 90);
            } else {
                sPayLimitDay = _.date.incDay((new Date(self.recordSet.fieldByName('预计出运').val())).Format("yyyy-MM-dd"), oSQL[0].PayLimitDays);
            }
            self.recordSet.fieldByName('应收汇日').val(sPayLimitDay);
        }
    }
}
addListener([EVT_RECORDSET_AFTER_FIELD_CHANGED], cge_RecordSet_ShipingPlans);

//---<出运计划_BeaforeSave>
function evt_ShipingPlans_Beforesave(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == '出运计划') {
            var aRepeatList = [];
            var aOrderList = [];
            var aItemList = [];
            var aMessageList = [];
            var sCustomerNo = self.recordSet.fieldByName('客户编号').val();
            var sRecordID = self.recordSet.fieldByName('rid').val();
            var sMessage = '';
            var sSaleOrders = VLIB.dedupe(self.recordSet.fieldByName("产品资料.销售合同").getColValue()).join(';');
            var sCustomerContractNos = VLIB.dedupe(self.recordSet.fieldByName("产品资料.客户合同").getColValue()).join(';');
            self.recordSet.fieldByName("销售合同").val(sSaleOrders);
            self.recordSet.fieldByName("客户合同").val(sCustomerContractNos);
            //---判断重复出货：如同一客户[出运计划]未导入[出运明细]，容易导致同一票合同多次调货而产生重复出货的风险
            try {
                var oTable = self.recordSet.tableByName('产品资料');
                oTable.disableControl();
                var iBookMark = oTable.cursor();
                oTable.cursor(0, false);
                try {
                    oTable.down(function () {
                        aOrderList.push(self.recordSet.fieldByName('产品资料.销售合同').val());
                        aItemList.push(self.recordSet.fieldByName('产品资料.产品编号').val());

                    });
                } finally {
                    oTable.cursor(iBookMark, true);
                    oTable.enableControl('ShipingPlansLine');
                }
                aMessageList.push(_.language.get('系统检测到有关于该客户的出运计划：'));
                var aParams = []; //用于存放参数数组
                var aMsg = [];
                for (var i in aOrderList) {
                    var oTxt = {
                        "values": {
                            "sCustomerNo": sCustomerNo,
                            "sSalesOrderNo": aOrderList[i],
                            "sItemNo": aItemList[i],
                            "sRecordID": sRecordID
                        }
                    };
                    aParams.push(oTxt);
                    aMsg.push(aOrderList[i] + '/' + aItemList[i]);
                }
                var oSQL = _.db.execute('ShipingPlans_Select_ShipingPlans_ShipingPlansLine', aParams);
                var aParams = []; //用于存放参数数组
                var aMsg2 = [];
                if (oSQL.length > 0) {
                    for (var i in oSQL) {
                        if (oSQL[i].length > 0) {
                            var suid = oSQL[i][0].uid ? oSQL[i][0].uid : '';
                            var oTxt = {
                                "values": {
                                    "srid": suid
                                }
                            };
                            aParams.push(oTxt);
                            aMsg2.push(oSQL[i][0].InvoiceNO + '/' + aMsg[i]);
                        }
                    }
                    var oSQL2 = _.db.execute('ShipingPlans_Select_Sys_user', aParams);
                    if (oSQL2.length > 0) {
                        for (var i in oSQL2) {
                            if (oSQL2[i].length > 0) {
                                var sMsg = oSQL2[i][0].UserName + ':' + aMsg2[i];
                                aMessageList.push(sMsg);
                            }
                        }
                    }
                }
                aMessageList.push(_.language.get('未生成出运明细，可能发生重复出货的风险！'));
                if (aMessageList.length > 2) {
                    for (var i in aMessageList) {
                        var sMessage = sMessage + '<br>' + aMessageList[i] + ' ';
                    }
                    _.ui.showWarnning(sMessage);
                    return reject();
                }

                //---判断重复出货：防止用户在保存前，重复导入多次产品。
                var repIdx = 0;
                oTable.disableControl();
                var iBookMark = oTable.cursor();
                oTable.cursor(0, false);
                try {
                    oTable.down(function () {
                        var sStr = self.recordSet.fieldByName('产品资料.销售合同').val() + self.recordSet.fieldByName('产品资料.产品编号').val() + self.recordSet.fieldByName('产品资料.产品标识').val();
                        if (aRepeatList.indexOf(sStr) >= 0) {
                            repIdx++;
                        } else {
                            aRepeatList.push(sStr);
                        }
                    });
                    if (repIdx > 0) {
                        _.ui.showWarnning(_.language.get('系统识别您导入的产品疑似重复，请排序检查确认！'));
                        return reject();
                    }
                } finally {
                    oTable.cursor(iBookMark, true);
                    oTable.enableControl('ShipingPlansLine2');
                }
            } catch (err) {
                _.ui.showError(_.language.get('遍历子表数据出错！'));
                return reject();
            }
            resolve();
        } else {
            resolve();
        }
    });
}
addPromiseListener([EVT_RECORDSET_BEFORE_SAVE], evt_ShipingPlans_Beforesave);

function evt_RecordSet_ShipingPlans_New(obj) {
    var self = obj.form;
    if (self.moduleName == '出运计划') {
        if (window.aconfig) {
            self.recordSet.fieldByName('报关方式').val(window.aconfig.ShipingPlans_DeclareType);
        }
    }
}
addListener([EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], evt_RecordSet_ShipingPlans_New);

//---<出运计划_记录复制>
function evt_ShipingPlans_aftercopy(obj) {
    var self = obj.form;
    if (self.moduleName == "出运计划") {
        self.recordSet.fieldByName('数据流转至出运明细').val(false);
    }
}
addListener([EVT_RECORDSET_AFTER_COPY], evt_ShipingPlans_aftercopy);