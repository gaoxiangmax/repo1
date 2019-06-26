//---<报关单据_Show>
var fnDeclarationsShow = function (self) {
    if (self.recordSet.fieldByName('数据来源').val() == '商检单据') {
        self.field('厂商编号').show();
        self.field('厂商简称').show();
    } else {
        self.field('厂商编号').hide();
        self.field('厂商简称').hide();
    }
};

function evt_Declarations_Show(obj) {
    self = obj.form;
    if (self.moduleName == '报关单据') {
        fnDeclarationsShow(self);
    }
}
addListener([EVT_EDITFORM_CREATED,EVT_RECORDSET_AFTER_NEW,EVT_RECORDSET_AFTER_COPY], evt_Declarations_Show);

function cge_EditForm_Declarations(obj) {
    var self = obj.form;
    var cgeField = obj.field;
    if (self.moduleName == '报关单据') {
        if (cgeField.fullName == '报关单据.数据来源') {
            fnDeclarationsShow(self);
        }
    }
}
addListener([EVT_RECORDSET_AFTER_FIELD_CHANGED], cge_EditForm_Declarations);

function cge_RecordSet_Declarations(obj) {
    var self = obj.form;
    var cgeField = obj.field;
    if (self.moduleName == '报关单据') {
        //---<报关单据_报关单价> 
        var aFullName = ['报关单据.产品资料.出货数量', '报关单据.产品资料.总净重', '报关单据.产品资料.报关总价', '报关单据.产品资料.计价方式'];
        if ($.inArray(cgeField.fullName, aFullName) != -1) {
            var fQty;
            if (self.recordSet.fieldByName('产品资料.计价方式').val() == '重量') {
                fQty = self.recordSet.fieldByName('产品资料.总净重').val();
            } else {
                fQty = self.recordSet.fieldByName('产品资料.出货数量').val();
            }
            if (fQty > 0) {
                self.recordSet.fieldByName('产品资料.报关单价').val((self.recordSet.fieldByName('产品资料.报关总价').val() / fQty).toFixed(3));
            }
        }
    }
}
addListener([EVT_RECORDSET_AFTER_FIELD_CHANGED], cge_RecordSet_Declarations);