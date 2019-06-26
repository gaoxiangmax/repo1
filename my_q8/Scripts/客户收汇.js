//---<客户收汇_美金汇率>
function cge_RecordSet_Incomes(obj) {
    var self = obj.form;
    var cgeField = obj.field;
    if (self.moduleName == '客户收汇') {
        if (cgeField.fullName == '客户收汇.收汇币种') {
            var oSQL = _.db.execute('Incomes_Select_Dic_Currency', {
                "values": {}
            });
            if (oSQL.length > 0) {
                self.recordSet.fieldByName('美金汇率').val(oSQL[0].Rate);
            }
        }
    }
}
addListener([EVT_RECORDSET_AFTER_FIELD_CHANGED], cge_RecordSet_Incomes);

function evt_Incomes_Beforesave(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == '客户收汇') {
            var bIncomes_ApportionmentCheck = window.aconfig.Incomes_ApportionmentCheck;
            if (bIncomes_ApportionmentCheck) {
                var fNetAmountExpected = self.recordSet.fieldByName('收汇净额').val();
                var fChargeAmount = self.recordSet.fieldByName('扣款合计').val();
                var fApportionment = 0;
                var oTable = self.recordSet.tableByName('详细用途');
                oTable.disableControl(); //禁用子表对象，提高游标循环效率
                var iBookMark = oTable.cursor(); //获取当前焦点记录游标
                oTable.cursor(0, false);
                try {
                    oTable.down(function () {
                        fApportionment = self.recordSet.fieldByName('详细用途.使用金额').val() * fChargeAmount / fNetAmountExpected;
                        self.recordSet.fieldByName('详细用途.分摊扣款').val(fApportionment.toFixed(6))
                    }); //down是从上往下滚，up是从下往上滚；
                } finally {
                    oTable.cursor(iBookMark, true); //回滚至初始焦点记录
                    oTable.enableControl('Batch_Incomes'); //释放子表对象
                }
            }
            resolve();
        } else {
            resolve();
        }
    });
}
addPromiseListener([EVT_RECORDSET_BEFORE_SAVE], evt_Incomes_Beforesave);