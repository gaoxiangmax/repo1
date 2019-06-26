function evt_Stock_FormDelete(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == '库存信息') {
            _.ui.showWarnning(_.language.get('为保证数据统一，系统不允许删除！请通过[产品入库]或[产品出库]执行！'));
            reject(false);
        } else {
            resolve();
        }
    });
}
addPromiseListener([EVT_SEARCHFORM_BEFORE_DELETE, EVT_EDITFORM_BEFORE_DELETE], evt_Stock_FormDelete);