//---<请假单_Show>
function evt_StaffExcuses_Show(obj) {
    var self = obj.form;
    if (self.moduleName == '请假单') {
        if (!self.recordSet.fieldByName('姓名').val()) {
            var oSQL = _.db.execute('StaffExcuses_Select_Archives', {
                "values": {
                    "sUserName": self.recordSet.fieldByName('畅想用户名').val()
                }
            });
            if (oSQL.length > 0) {
                self.recordSet.fieldByName('姓名').val(oSQL[0].Name);
            }
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], evt_StaffExcuses_Show);