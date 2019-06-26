//---<工厂资料_BeaforeSave>
function evt_Suppliers_Beforesave(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == '工厂资料') {
            var sSupplierNo, sSupplierShortName;
            //子表不可为空
            if (self.recordSet.tableByName('联系人').recordCount() == 0) {
                if (self.field) {
                    _.ui.showWarnning(_.language.get('子表不能为空!'), function () {
                        reject('子表不能为空!');
                    });
                } else {
                    resolve();
                }
            } else {
                //将开户银行赋值到主表
                if (self.recordSet.tableByName('开户银行').recordCount() > 0) {
                    self.recordSet.tableByName('开户银行').cursor(0, true);
                    var sSubBank = self.recordSet.fieldByName('开户银行.开户银行').val();
                    if (self.recordSet.fieldByName('开户银行').val() != sSubBank) {
                        self.recordSet.fieldByName('开户银行').val(sSubBank);
                    }
                    var sSubBankAcount = self.recordSet.fieldByName('开户银行.银行帐号').val();
                    if (self.recordSet.fieldByName('银行帐号').val() != sSubBankAcount) {
                        self.recordSet.fieldByName('银行帐号').val(sSubBankAcount);
                    }
                    var sSubBankTax = self.recordSet.fieldByName('开户银行.公司税号').val();
                    if (self.recordSet.fieldByName('公司税号').val() != sSubBankTax) {
                        self.recordSet.fieldByName('公司税号').val(sSubBankTax);
                    }
                    var sSubBankAdress = self.recordSet.fieldByName('开户银行.银行地址').val();
                    if (self.recordSet.fieldByName('银行地址').val() != sSubBankAdress) {
                        self.recordSet.fieldByName('银行地址').val(sSubBankAdress);
                    }
                }
                //当前为修改编辑状态
                if (self.recordSet.EditForm.modified) {
                    var oSQL = _.db.execute('Suppliers_Select_Suppliers', {
                        "values": {
                            "srid": self.recordSet.fieldByName('rid').val()
                        }
                    });
                    if (oSQL.length > 0) {
                        sSupplierNo = oSQL[0].SupplierNo;
                        sSupplierShortName = oSQL[0].SupplierShortName;
                    }
                    if (sSupplierNo != self.recordSet.fieldByName('厂商编号').val()) {
                        _.db.execute('Suppliers_Update_ItemsQuote', {
                            "values": {
                                "sSupplierNo": self.recordSet.fieldByName('厂商编号').val(),
                                "sSupplierNo2": sSupplierNo
                            }
                        });
                        _.db.execute('Suppliers_Update_ItemsConstruction', {
                            "values": {
                                "sSupplierNo": self.recordSet.fieldByName('厂商编号').val(),
                                "sSupplierNo2": sSupplierNo
                            }
                        });
                    }
                    if (sSupplierShortName != self.recordSet.fieldByName('厂商简称').val()) {
                        _.db.execute('Suppliers_Update_ItemsQuote2', {
                            "values": {
                                "sSupplierShortName": self.recordSet.fieldByName('厂商简称').val(),
                                "sSupplierShortName2": sSupplierShortName
                            }
                        });
                        _.db.execute('Suppliers_Update_ItemsConstruction2', {
                            "values": {
                                "sSupplierShortName": self.recordSet.fieldByName('厂商简称').val(),
                                "sSupplierShortName2": sSupplierShortName
                            }
                        });
                    }
                }
                resolve();
            }
        } else {
            resolve();
        }
    });
}
addPromiseListener([EVT_RECORDSET_BEFORE_SAVE], evt_Suppliers_Beforesave);

//---<工厂资料_记录复制>
function evt_Suppliers_aftercopy(obj) {
    var self = obj.form;
    if (self.moduleName == "工厂资料") {
        self.recordSet.fieldByName('开发时间').val((new Date()).Format("yyyy-MM-dd hh:mm:ss"));
        self.recordSet.fieldByName('最近成交').val('');
        self.recordSet.fieldByName('采购总额').val(0);
        self.recordSet.fieldByName('出货总额').val(0);
    }
}
addListener([EVT_RECORDSET_AFTER_COPY], evt_Suppliers_aftercopy);