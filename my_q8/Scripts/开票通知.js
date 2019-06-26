//---<开票通知_自动生成收票管理>
var fnBillNotifies_AutoSupplyInvoices = function (self) {
    VLIB.cxAutoData(self, self.rid, '开票通知.开票编号', '收票管理.开票编号', '', '', '', false);
}

function btn_BillNotifies(obj) {
    var self = obj.form;
    if (self.moduleName == '开票通知') {
        if (self.addButton) {
            self.addButton("bExtend", _.language.get("扩展"), "", "yelp", true); //下拉菜单
            self.button('bExtend').addButton("bShipmentsAutoInspections", _.language.get("自动生成收票管理"), function () {
                fnBillNotifies_AutoSupplyInvoices(self);
            });
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY, EVT_SEARCHFORM_CREATED], btn_BillNotifies);

//---<开票通知_BeforeSave>
function evt_BillNotifies_BeforeSave(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == '开票通知') {
            var aHSCode = [];
            var aBillName = [];
            var aBillQty = [];
            var aBillAmount = [];
            var aBillUnit = [];
            var ind;
            var oTable = self.recordSet.tableByName('产品资料');
            if (oTable.recordCount() == 0) {
                return;
            }
            oTable.disableControl();
            var iBookMark = oTable.cursor();
            oTable.cursor(0, false);
            try {
                oTable.down(function () {
                    ind = aBillName.indexOf(self.recordSet.fieldByName('产品资料.开票品名').val());
                    if (ind < 0) {
                        aHSCode.push(self.recordSet.fieldByName('产品资料.海关编码').val());
                        aBillName.push(self.recordSet.fieldByName('产品资料.开票品名').val());
                        aBillQty.push(self.recordSet.fieldByName('产品资料.开票数量').val());
                        aBillAmount.push(self.recordSet.fieldByName('产品资料.开票金额').val());
                        aBillUnit.push(self.recordSet.fieldByName('产品资料.计量单位').val());
                    } else {
                        aBillQty[ind] = aBillQty[ind] + self.recordSet.fieldByName('产品资料.开票数量').val();
                        aBillAmount[ind] = aBillAmount[ind] + self.recordSet.fieldByName('产品资料.开票金额').val();
                    }
                });
            } finally {
                oTable.cursor(iBookMark, true);
                oTable.enableControl('Batch_BillNotifies');
            }
            var oTable = self.recordSet.tableByName('开票内容');
            oTable.disableControl();
            oTable.clear();
            try {
                for (var i in aBillName) {
                    oTable.append();
                    self.recordSet.fieldByName('开票内容.海关编码').val(aHSCode[i]);
                    self.recordSet.fieldByName('开票内容.开票品名').val(aBillName[i]);
                    self.recordSet.fieldByName('开票内容.开票数量').val(_.convert.toFloat(aBillQty[i], 2));
                    self.recordSet.fieldByName('开票内容.计量单位').val(aBillUnit[i]);
                    self.recordSet.fieldByName('开票内容.开票金额').val(_.convert.toFloat(aBillAmount[i], 2));
                }
            } finally {
                oTable.cursor(0, true);
                oTable.enableControl('Batch_BillNotifies2');
            }
            var sPurchaseOrderNos = VLIB.dedupe(self.recordSet.fieldByName("产品资料.采购合同").getColValue()).join(';');
            self.recordSet.fieldByName("采购合同").val(sPurchaseOrderNos);
            resolve();
        } else {
            resolve();
        }
    });
}
addPromiseListener([EVT_RECORDSET_BEFORE_SAVE], evt_BillNotifies_BeforeSave);