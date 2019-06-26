//--<产品入库_审核并生成库存明细>
var fnGodownEntryToStock = function (self, isArchived) {
    var sGodownEntryNo = self.recordSet.fieldByName('入库单号').val();
    var sWarehouse = self.recordSet.fieldByName('仓库名称').val();
    var dDate = self.recordSet.fieldByName('入库日期').val();
    var sSalesOrderNo = self.recordSet.fieldByName('销售合同').val();
    var sCustomerShortName = self.recordSet.fieldByName('客户简称').val();
    var sPurchaseOrderNo = self.recordSet.fieldByName('采购合同').val();
    var sSupplierShortName = self.recordSet.fieldByName('厂商简称').val();
    var sUserID = _.app.cxUserInfo().recordID;
    var srid = self.recordSet.fieldByName('rid').val();
    var scid = self.recordSet.fieldByName('cid').val();
    try {
        if (!isArchived) {
            _.db.execute('GodownEntry_Delete_Stock', {
                "values": {
                    "sGodownEntryNo": sGodownEntryNo
                }
            });
            var oTable = self.recordSet.tableByName('产品资料');
            var aParams = []; //用于存放参数数组
            oTable.disableControl();
            var iBookMark = oTable.cursor(); //获取当前焦点记录游标
            oTable.cursor(0, false);
            try {
                oTable.down(function () {
                    var oTxt = {
                        "values": {
                            "scid": scid,
                            "srid": srid,
                            "sUserID": sUserID,
                            "sGodownEntryNo": sGodownEntryNo,
                            "dDate": dDate,
                            "sSalesOrderNo": sSalesOrderNo,
                            "sWarehouse": sWarehouse,
                            "sCustomerShortName": sCustomerShortName,
                            "sPurchaseOrderNo": sPurchaseOrderNo,
                            "sSupplierShortName": sSupplierShortName,
                            "sItemNo": self.recordSet.fieldByName('产品资料.产品编号').val(),
                            "sBarcode": self.recordSet.fieldByName('产品资料.产品条码').val(),
                            "sCHNItemName": self.recordSet.fieldByName('产品资料.中文品名').val(),
                            "sCHNSpecification": self.recordSet.fieldByName('产品资料.中文规格').val(),
                            "sCustomerItemNo": self.recordSet.fieldByName('产品资料.客户货号').val(),
                            "sUnit": self.recordSet.fieldByName('产品资料.计量单位').val(),
                            "fInQty": self.recordSet.fieldByName('产品资料.入库数量').val(),
                            "sMemo": self.recordSet.fieldByName('产品资料.备注').val()
                        }
                    }
                    aParams.push(oTxt); //将待插入[库存信息]的数据参数存入数组
                });
            } finally {
                oTable.cursor(iBookMark, true); //回滚至初始焦点记录
                oTable.enableControl('Batch_GodownEntry'); //释放子表对象
            }
            _.db.execute('GodownEntry_Insert_Stock', aParams);
            _.db.utils.setArchived('产品入库', srid, true);
            _.ui.showInfo(sGodownEntryNo + '，' + _.language.get('库存明细已生成！'));
        } else {
            _.ui.showWarnning(sGodownEntryNo + '，' + _.language.get('已审核归档，无法生成库存明细！'));
        }
    } catch (err) {
        _.log.error('执行审核归档出错！');
    }
};

function btn_GodownEntry_Review(obj) {
    var self = obj.form;
    if (self.moduleName == '产品入库') {
        if (self.addButton) {
            self.addButton("bExtend", _.language.get("扩展"), "", "yelp", true);
            self.button('bExtend').addButton("bGodownEntry_Review", _.language.get("审核并生成库存明细"), function () {
                if (self.modified) {
                    _.ui.showWarnning(_.language.get('记录未保存，系统停止操作！'));
                    return;
                }
                var isArchived;
                var oTxt = {
                    "values": {
                        "srid": self.recordSet.fieldByName('rid').val()
                    }
                }
                var oSQL = _.db.execute('GodownEntry_Select_GodownEntry', oTxt);
                if (oSQL.length > 0) {
                    if (oSQL[0].archived == 1) {
                        isArchived = true;
                    } else {
                        isArchived = false;
                    }
                    fnGodownEntryToStock(self, isArchived);
                }
            });
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], btn_GodownEntry_Review);

//---<产品入库_AfterSave>
function evt_GodownEntry_AfterSave(obj) {
    var self = obj.form;
    if (self.moduleName == '产品入库') {
        var isArchived;
        var oTxt = {
            "values": {
                "srid": self.recordSet.fieldByName('rid').val()
            }
        }
        var oSQL = _.db.execute('GodownEntry_Select_GodownEntry', oTxt);
        if (oSQL.length > 0) {
            if (oSQL[0].archived == 1) {
                isArchived = true;
            } else {
                isArchived = false;
            }
            if (!isArchived) {
                _.ui.yesOrNo(
                    _.language.get('该记录符合生成[库存信息]的条件，是否执行生成指令！'),
                    okfunc = function () {
                        fnGodownEntryToStock(self, isArchived);
                    }
                );
            }
        }
    }
}
addListener([EVT_RECORDSET_AFTER_SAVE], evt_GodownEntry_AfterSave);

//---<产品入库_BeforeDelete>
function evt_GodownEntry_BeforeDelete(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == '产品入库') {
            try {
                var srid;
                if (self.type == 'search') {
                    srid = self.rid;
                } else {
                    srid = self.recordSet.fieldByName('rid').val();
                }
                _.db.utils.queryArchived('产品入库', srid, function (res) {
                    if (res === false) {
                        _.db.execute('GodownEntry_Delete_Stock2', {
                            "values": {
                                "srid": srid
                            }
                        });
                        _.ui.showInfo(_.language.get('为保证库存数据一致性，系统已将[库存信息]相应记录一并删除！'));
                    }
                });
                resolve();
            } catch (err) {
                _.ui.showWarnning(_.language.get('操作失败！'));
                reject();
            }
        } else {
            resolve();
        }
    });
}
addPromiseListener([EVT_SEARCHFORM_BEFORE_DELETE, EVT_EDITFORM_BEFORE_DELETE], evt_GodownEntry_BeforeDelete);

//---<产品入库_DrawCell>
function evt_GodownEntry_DrawCell(obj) {
    var self = obj.form;
    var fnGodownEntry_DrawCell = function (idx) {
        var oTable = self.recordSet.tableByName("产品资料");
        if (oTable.indexVal(idx, '产品资料.产品编号') == 0) {
            oTable.setStyle({
                style: {
                    background: "red"
                }
            }, '产品入库.产品资料.入库数量', idx);
        } else {
            oTable.setStyle({
                style: VLIB.defultstyle
            }, '产品入库.产品资料.入库数量', idx);
        }
    };
    if (self.moduleName == '产品入库') {
        if (obj.rEvent == EVT_FIELD_CHANGED && obj.field.fullName == '产品入库.产品资料.入库数量') {
            var i = self.recordSet.tableByName("产品资料").cursor();
            fnGodownEntry_DrawCell(i);
        }
        if (obj.rEvent == EVT_SYNC_TABLEDATA) {
            for (var i in obj.table.data) {
                fnGodownEntry_DrawCell(i);
            }
        }
    }
}
addListener([EVT_EDITFORM_GET_STYLE], evt_GodownEntry_DrawCell);