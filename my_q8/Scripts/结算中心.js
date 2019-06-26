// 是否结账
var fnIsCheckout = function (self) {
    if (self.recordSet.fieldByName('是否结账').val()) {
        self.recordSet.fieldByName('结账日期').val((new Date()).Format("yyyy-MM-dd"));
        self.recordSet.EditForm.UISave(false, function () {
            self.recordSet.EditForm.buttons.button_mark_archive.click();
        })
    } else {
        self.recordSet.fieldByName('结账日期').val([]);
        self.recordSet.EditForm.UISave(false, function () {
            self.recordSet.EditForm.buttons.button_mark_unarchive.click();
        })
    }
}

function cge_RecordSet_Settlements(obj) {
    var self = obj.form;
    var cgeField = obj.field;
    if (self.moduleName == '结算中心') {
        //---<产品资料_产品组成>
        if (cgeField.fullName == '结算中心.是否结账') {
            fnIsCheckout(self);
        }
    }
}
addListener([EVT_RECORDSET_AFTER_FIELD_CHANGED], cge_RecordSet_Settlements);

//---<结算中心_BefordDelete>
function evt_Settlements_BeforeDelete(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == '结算中心') {
            var sInvoiceNO;
            var srid;
            if (self.type == 'search') {
                srid = self.rid;
            } else {
                srid = self.recordSet.fieldByName('rid').val();
            }
            var oSQL = _.db.execute('Settlements_Select_Settlements', {
                "values": {
                    "srid": srid
                }
            });
            if (oSQL.length > 0) {
                sInvoiceNO = oSQL[0].InvoiceNO;
            }
            //---检查客户收汇、国内费用、国外费用、退税管理
            var oSQL = _.db.execute('Settlements_Select_yj', {
                "values": {
                    "sInvoiceNO1": sInvoiceNO,
                    "sInvoiceNO2": sInvoiceNO,
                    "sInvoiceNO3": sInvoiceNO,
                    "sInvoiceNO4": sInvoiceNO,
                }
            });
            if (oSQL.length > 0) {
                _.ui.showWarnning(_.language.get('该票结算中心已与财务管理其他模块发生关联，系统终止删除操作！'));
                reject();
            } else {
                resolve();
            }
        } else {
            resolve();
        }
    });
}
addPromiseListener([EVT_SEARCHFORM_BEFORE_DELETE, EVT_EDITFORM_BEFORE_DELETE], evt_Settlements_BeforeDelete);

function btn_Settlements(obj) {
    var self = obj.form;
    if (self.moduleName == '结算中心') {
        if (self.addButton) {
            self.addButton("bSettlementsStatus", "财务状态", "", "bookmark icon", true, true); //下拉菜单
            self.button("bSettlementsStatus").addButton("bNotice", '<a class="ui orange label">' + _.language.get('已通知开票') + '</a>', function () {
                VLIB.Status(self, '结算中心', 'Settlements', '财务状态', 'SettlementsStatus', '已通知开票');
            });
            self.button("bSettlementsStatus").addButton("bCollectTickets", '<a class="ui olive label">' + _.language.get('已收票') + '</a>', function () {
                VLIB.Status(self, '结算中心', 'Settlements', '财务状态', 'SettlementsStatus', '已收票');
            });

            self.button("bSettlementsStatus").addButton("bReceivables", '<a class="ui green label">' + _.language.get('已收款') + '</a>', function () {
                VLIB.Status(self, '结算中心', 'Settlements', '财务状态', 'SettlementsStatus', '已收款');
            });
            self.button("bSettlementsStatus").addButton("bPayment", '<a class="ui teal label">' + _.language.get('已付款') + '</a>', function () {
                VLIB.Status(self, '结算中心', 'Settlements', '财务状态', 'SettlementsStatus', '已付款');
            });
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY, EVT_SEARCHFORM_CREATED], btn_Settlements);