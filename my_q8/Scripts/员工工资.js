//---<员工工资_清清空明细信息>
function btn_Wage_Clear(obj) {
    var self = obj.form;
    if (self.moduleName == '员工工资') {
        self.area('明细信息').addButton("bSheetExtend", _.language.get("扩展"), "", "yelp", true); //下拉菜单
        self.area('明细信息').button('bSheetExtend').addButton("bage_Clear", _.language.get("清空明细信息"), function () {
            self.recordSet.tableByName("明细信息").clear();
        });
    }
};
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], btn_Wage_Clear);

//---<员工工资_Show>
function evt_Wage_Show(obj) {
    var self = obj.form;
    if (self.moduleName == '员工工资') {
        if (self.recordJob == 'new' || self.recordJob == 'copy') {
            self.recordSet.fieldByName('年份').val((new Date()).Format("yyyy"));
            self.recordSet.fieldByName('月份').val((new Date()).Format("MM"));
            self.recordSet.fieldByName('制表日期').val((new Date()).Format("yyyy-MM-dd"));
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], evt_Wage_Show);

//---<员工工资_BeforeSave>
function evt_Wage_BeforeSave(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == '员工工资') {
            if (self.type == 'new' || self.recordJob == 'copy') {
                var oSQL = _.db.execute('Wage_Select_Wage', {
                    "values": {
                        "iYear": self.recordSet.fieldByName('年份').val(),
                        "iMonth": self.recordSet.fieldByName('月份').val()
                    }
                });
                if (oSQL.length > 0) {
                    _.ui.showWarnning(_.language.get('本月工资已登记，请检查！'));
                    reject();
                } else {
                    resolve();
                }
            } else {
                resolve();
            }
        } else {
            resolve();
        }
    });
}
addPromiseListener([EVT_RECORDSET_BEFORE_SAVE], evt_Wage_BeforeSave);