//---<员工档案_离职日期>
var fnArchivesLeaveDate = function (self) {
    if (self.recordSet.fieldByName('合同状态').val() == '已解除') {
        self.field('离职日期').show();
    } else {
        self.field('离职日期').hide();
    }
};

function evt_Archives_LeaveDate(obj) {
    var self = obj.form;
    if (self.moduleName == '员工档案') {
        fnArchivesLeaveDate(self);
    }
}
addListener([EVT_EDITFORM_CREATED,EVT_RECORDSET_AFTER_NEW,EVT_RECORDSET_AFTER_COPY], evt_Archives_LeaveDate);

function cge_EditForm_Archives(obj) {
    var self = obj.form;
    var cgeField = obj.field;
    if (self.moduleName == '员工档案') {
        if (cgeField.fullName == '员工档案.合同状态') {
            fnArchivesLeaveDate(self);
        }
    }
}
addListener([EVT_RECORDSET_AFTER_FIELD_CHANGED], cge_EditForm_Archives);