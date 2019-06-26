//---<人事合同_BeforeSave>
function evt_StaffContracts_BeforeSave(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == '人事合同') {
            try {
                var sExpiryDate, sStatus, sUserName;
                sExpiryDate = self.recordSet.fieldByName('失效日期').val();
                sStatus = self.recordSet.fieldByName('合同状态').val();
                sUserName = self.recordSet.fieldByName('畅想用户名').val();
                var oTxt = {
                    "values": {
                        "sUserName": sUserName
                    }
                }
                var oSQL = _.db.execute('StaffContracts_Select_Archives', oTxt);
                if (oSQL.length > 0 && oSQL[0].EndContractDate && sExpiryDate.length > 0) {
                    if (_.date.dateDiff(sExpiryDate, oSQL[0].EndContractDate) != 0 || sStatus != oSQL[0].Status) {
                        _.ui.showWarnning(_.language.get('由于该合同与[员工档案]的合同到期日期或合同状态不一致，系统将执行更新操作！'));
                        _.db.execute('StaffContracts_Update_Archives', {
                            "values": {
                                "sExpiryDate": sExpiryDate,
                                "sStatus": sStatus,
                                "sUserName": sUserName
                            }
                        });
                    }
                }
                resolve();
            } catch (err) {
                reject();
                _.log.error(err.message);
            }
        } else {
            resolve();
        }
    });
}
addPromiseListener([EVT_RECORDSET_BEFORE_SAVE], evt_StaffContracts_BeforeSave);