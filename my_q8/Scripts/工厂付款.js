//---<工厂付款_Beforesave>
function evt_Payments_UnUsedAmount(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == '工厂付款') {
            if (self.recordSet.fieldByName('未使用金额').val() < 0) {
                _.ui.showWarnning(_.language.get('注意：该单申请的[支付金额]不足！'));
            }
            resolve();
        } else {
            resolve();
        }
    });
}
addPromiseListener([EVT_RECORDSET_BEFORE_SAVE], evt_Payments_UnUsedAmount);

function cge_RecordSet_Payments(obj) {
    var self = obj.form;
    var cgeField = obj.field;
    if (self.moduleName == '工厂付款') {
        if (cgeField.fullName == '工厂付款.付款单号') {
            _.db.execute('Payments_CallProc_Proc_BillNotifies_Statistics', {
                "values": {
                    "sID": self.recordSet.fieldByName('付款单号').val()
                }
            });
        }
    }
}
addListener([EVT_RECORDSET_AFTER_FIELD_CHANGED], cge_RecordSet_Payments);

function evt_Wage_Show(obj) {
    var self = obj.form;
    if (self.moduleName == '工厂付款') {
        _.db.execute('Payments_Delete_Tempyj', '');
        var sID = self.recordSet.fieldByName('付款单号').val();
        if (sID.length > 0) {
            _.db.execute('Payments_CallProc_Proc_BillNotifies_Statistics', {
                "values": {
                    "sID": sID
                }
            });
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], evt_Wage_Show);