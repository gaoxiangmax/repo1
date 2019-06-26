//---<客诉管理_索赔金额显示>
var fnComplaints_isShow = function (self) {
    if (self.recordSet.fieldByName('是否索赔').val()) {
        self.field('货币代码').show();
        self.field('客户索赔金额').show();
        self.field('给客户实赔金额').show();
        self.field('向工厂索赔金额').show();
        self.field('工厂实赔金额').show();
    } else {
        self.field('货币代码').hide();
        self.field('客户索赔金额').hide();
        self.field('给客户实赔金额').hide();
        self.field('向工厂索赔金额').hide();
        self.field('工厂实赔金额').hide();

    }
};

function evt_Complaints_isShow(obj) {
    var self = obj.form;
    if (self.moduleName == '客诉管理') {
        fnComplaints_isShow(self);
    }
}
addListener([EVT_EDITFORM_CREATED,EVT_RECORDSET_AFTER_NEW,EVT_RECORDSET_AFTER_COPY], evt_Complaints_isShow);

function cge_EditForm_Complaints(obj) {
    var self = obj.form;
    var cgeField = obj.field;
    if (self.moduleName == '客诉管理') {
        if (cgeField.fullName == '客诉管理.是否索赔') {
            fnComplaints_isShow(self);
        }
    }
}
addListener([EVT_RECORDSET_AFTER_FIELD_CHANGED], cge_EditForm_Complaints);