//---<收票管理_进货凭证号>
var fnSupplyInvoices_PurchaseProofNO = function (self) {
    self.recordSet.fieldByName('开票内容.进货凭证号').val(self.recordSet.fieldByName('开票内容.增值税发票代码').val() +
        self.recordSet.fieldByName('开票内容.增值税发票号码').val());
};

function evt_SupplyInvoices_PurchaseProofNO(obj) {
    var self = obj.form;
    if (self.moduleName == '收票管理') {
        if (obj.table.name == '开票内容') {
            fnSupplyInvoices_PurchaseProofNO(self);
        }
    }
}
addListener([EVT_RECORDSET_AFTER_CHILD_NEW, EVT_RECORDSET_AFTER_CHILD_COPY, EVT_RECORDSET_AFTER_CHILD_INSERT], evt_SupplyInvoices_PurchaseProofNO);

function cge_RecordSet_SupplyInvoices(obj) {
    var self = obj.form;
    var cgeField = obj.field;
    if (self.moduleName == '收票管理') {
        var aFullName = ['收票管理.开票内容.增值税发票代码', '收票管理.开票内容.增值税发票号码'];
        if ($.inArray(cgeField.fullName, aFullName) != -1) {
            fnSupplyInvoices_PurchaseProofNO(self);
        }
    }
}
addListener([EVT_RECORDSET_AFTER_FIELD_CHANGED], cge_RecordSet_SupplyInvoices);