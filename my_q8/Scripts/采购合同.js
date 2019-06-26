//---<采购合同_Beforesave>
function evt_PurchaseOrders_Beforesave(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == '采购合同') {
            if (self.recordJob == 'copy') {
                self.recordSet.fieldByName('费用标识').val('');
            }
            resolve();
        } else {
            resolve();
        }
    });
}
addPromiseListener([EVT_RECORDSET_BEFORE_SAVE], evt_PurchaseOrders_Beforesave);

//---<采购合同_Aftersave>
function evt_PurchaseOrders_Aftersave(obj) {
    var self = obj.form;
    if (self.moduleName == '采购合同') {
        var sPurchasingAgent = self.recordSet.fieldByName('采购员').val();
        if (sPurchasingAgent && sPurchasingAgent != self.recordSet.fieldByName('uid').val()) {
            _.db.execute('PurchaseOrders_Update_PurchaseOrders', {
                "values": {
                    "sUserName": sPurchasingAgent,
                    "srid": self.recordSet.fieldByName('rid').val()
                }
            });
        }
    }
}
addListener([EVT_RECORDSET_AFTER_SAVE], evt_PurchaseOrders_Aftersave);

//---<采购合同_Show>
var fnPurchaseOrders_isShow = function (self) {
    if (self.field) {
        if (self.recordSet.fieldByName('有无定金').val()) {
            self.field('定金日期').show();
            self.field('已付定金').show();
        } else {
            self.field('定金日期').hide();
            self.field('已付定金').hide();
        }
    }
};

function evt_PurchaseOrders_isShow(obj) {
    var self = obj.form;
    if (self.moduleName == '采购合同') {
        fnPurchaseOrders_isShow(self);
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], evt_PurchaseOrders_isShow);

function cge_EditForm_PurchaseOrders(obj) {
    var self = obj.form;
    var cgeField = obj.field;
    if (self.moduleName == '采购合同') {
        if (cgeField.fullName == '采购合同.有无定金') {
            fnPurchaseOrders_isShow(self);
        }
    }
}
addListener([EVT_RECORDSET_AFTER_FIELD_CHANGED], cge_EditForm_PurchaseOrders);

//---<采购合同_点击打印前>
function evt_PurchaseOrders_beforePrint(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == "采购合同") {
            if (VLIB.cxCheckWorkflowState('采购合同', self.rid) > -1 || window.aconfig.PurchaseOrders_PrintBeforeStartupCheck) {
                resolve();
            } else {
                _.ui.showWarnning(_.language.get("系统不允许启动审批前打印报表！详见[配置中心]-[Q系配置]-[全局控制]！"));
                reject();
            }
        } else {
            resolve();
        }
    });
}
addPromiseListener([EVT_SEARCHFORM_BEFORE_REPORT, EVT_EDITFORM_BEFORE_REPORT], evt_PurchaseOrders_beforePrint);

function btn_PurchaseOrders(obj) {
    var self = obj.form;
    if (self.moduleName == '采购合同') {
        if (self.addButton) {
            self.addButton("bPurchaseOrderStatus", "合同状态", "", "bookmark icon", true, true); //下拉菜单
            self.button("bPurchaseOrderStatus").addButton("bCancel", '<a class="ui orange label">' + _.language.get('合同作废') + '</a>', function () {
                VLIB.Status(self, '采购合同', 'PurchaseOrders', '合同状态', 'PurchaseOrderStatus', '已作废');
            });
            self.button("bPurchaseOrderStatus").addButton("bTobeConfirmed", '<a class="ui olive label">' + _.language.get('合同待确认') + '</a>', function () {
                VLIB.Status(self, '采购合同', 'PurchaseOrders', '合同状态', 'PurchaseOrderStatus', '待确认');
            });
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY, EVT_SEARCHFORM_CREATED], btn_PurchaseOrders);

//---<采购合同_记录复制>
function evt_PurchaseOrders_aftercopy(obj) {
    var self = obj.form;
    if (self.moduleName == "采购合同") {
        oTable = self.recordSet.tableByName("产品资料");
        self.recordSet.fieldByName('已付定金').val(0);
        self.recordSet.fieldByName('定金日期').val('');
        self.recordSet.fieldByName('费用标识').val('');
        self.recordSet.fieldByName('已申请付款').val(0);
        self.recordSet.fieldByName('已付货款').val(0);

        var iBookMark = oTable.cursor();
        oTable.cursor(0, false);
        try {
            oTable.down(function () {
                self.recordSet.fieldByName('产品资料.已出货数').val(0);
            }); //down是从上往下滚，up是从下往上滚；
        } finally {
            oTable.cursor(iBookMark, true); //回滚至初始焦点记录
        }
    }
}
addListener([EVT_RECORDSET_AFTER_COPY], evt_PurchaseOrders_aftercopy);

//---<采购合同_产品资料记录复制>
function evt_PurchaseOrders_Child_aftercopy(obj) {
    var self = obj.form;
    if (self.moduleName == '采购合同') {
        if (obj.table.name == '产品资料') {
            self.recordSet.fieldByName('产品资料.已出货数').val(0);
        }
    }
}
addListener([EVT_RECORDSET_AFTER_CHILD_COPY], evt_PurchaseOrders_Child_aftercopy);