function evt_Documentary_FormOnShow(obj) {
    var self = obj.form;
    if (self.moduleName == '采购跟单') {
        //---<跟单进度初始化>
        var fnDocumentaryInit = function () {
            if (self.recordSet.EditForm.modified || self.recordSet.EditForm.recordJob == 'copy' || self.recordSet.EditForm.recordJob == 'new') {
                var oTable = self.recordSet.tableByName('跟单进度');
                if (oTable.recordCount() > 0) {
                    return;
                }
                var oSQL = _.db.execute('Documentary_Select_Dic_Documentary', {});
                if (oSQL.length == 0) {
                    _.ui.showWarnning(_.language.get('业务字典-跟单项目未完成数据初始化！'));
                    return;
                } else {
                    oTable.disableControl();
                    for (var i in oSQL) {
                        oTable.append();
                        self.recordSet.fieldByName('跟单进度.跟进内容').val(oSQL[i].Name);
                    }
                    oTable.cursor(0, true);
                    oTable.enableControl('Batch_Documentary');
                }
            }
        };
        fnDocumentaryInit();
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], evt_Documentary_FormOnShow);


function evt_Documentary_BeforeSave(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == '采购跟单') {
            //---<是否结案>
            var fnIsClosed = function (callback) {
                try {
                    if (self.recordSet.fieldByName('是否结案').val()) {
                        _.ui.yesOrNo(
                            _.language.get('确认结案，系统将给予该单归档处理！'),
                            okfunc = function () {
                                _.db.utils.setArchived('采购跟单', self.rid, true);
                                _.ui.showWarnning(_.language.get('该合同结案，系统已归档！'));
                            },
                            cancelfunc = function () {
                                self.recordSet.fieldByName('是否结案').val(false);
                            }
                        );
                    }
                    callback(true);
                } catch (err) {
                    _.ui.error('初始化跟进内容失败！');
                    callback(false);
                }
            };
            //---<跟单异常项统计>
            var fnAbnormalityOfTheAbnormity = function (callback) {
                var i = 0;
                var sAbnormalityOfTheAbnormity = '';
                var dToday = (new Date()).Format("yyyy-MM-dd");
                try {
                    var oTable = self.recordSet.tableByName('出运信息');
                    oTable.disableControl(); //禁用子表对象，提高游标循环效率
                    var iBookMark = oTable.cursor(); //获取当前焦点记录游标
                    oTable.cursor(0, false);
                    try {
                        oTable.down(function () {
                            if (self.recordSet.fieldByName('出运信息.预计出运日期').val().length > 0 && self.recordSet.fieldByName('出运信息.实际出运日期').val().length == 0) {
                                if (_.date.dateDiff(dToday, self.recordSet.fieldByName('出运信息.预计出运日期').val() >= 0)) {
                                    i++;
                                }
                            }
                        }); //down是从上往下滚，up是从下往上滚；
                    } finally {
                        oTable.cursor(iBookMark, true); //回滚至初始焦点记录
                        oTable.enableControl('Batch_Documentary2'); //释放子表对象
                    }

                    var oTable = self.recordSet.tableByName('跟单进度');
                    oTable.disableControl(); //禁用子表对象，提高游标循环效率
                    var iBookMark = oTable.cursor(); //获取当前焦点记录游标
                    oTable.cursor(0, false);
                    try {
                        oTable.down(function () {
                            if (self.recordSet.fieldByName('跟单进度.预计完成日期').val().length > 0 && self.recordSet.fieldByName('跟单进度.实际完成日期').val().length == 0) {
                                if (_.date.dateDiff(dToday, self.recordSet.fieldByName('跟单进度.预计完成日期').val() >= 0)) {
                                    i++;
                                }
                            }
                        }); //down是从上往下滚，up是从下往上滚；
                    } finally {
                        oTable.cursor(iBookMark, true); //回滚至初始焦点记录
                        oTable.enableControl('Batch_Documentary3'); //释放子表对象
                    }

                    if (i == 0) {
                        sAbnormalityOfTheAbnormity = '跟单正常';
                    } else {
                        sAbnormalityOfTheAbnormity = '发现' + i + '项异常，请关注！';
                    }
                    self.recordSet.fieldByName('跟单异常').val(sAbnormalityOfTheAbnormity);
                    callback(true);
                } catch (err) {
                    callback(false);
                }
            }

            fnIsClosed(function (res1) {
                if (res1 == true) {
                    fnAbnormalityOfTheAbnormity(function (res2) {
                        if (res2 == true) {
                            resolve();
                        } else {
                            reject();
                        }
                    });
                } else {
                    reject();
                }
            });
        } else {
            resolve();
        }
    });
}
addPromiseListener([EVT_RECORDSET_BEFORE_SAVE], evt_Documentary_BeforeSave);

function cge_RecordSet_Documentary(obj) {
    var self = obj.form;
    var cgeField = obj.field;
    if (self.moduleName == '采购跟单') {
        //确认日期
        if (cgeField.fullName == '采购跟单.跟单进度.确认完成') {
            if (self.recordSet.fieldByName('跟单进度.确认完成').val()) {
                self.recordSet.fieldByName('跟单进度.确认日期').val((new Date()).Format("yyyy-MM-dd"))
                self.recordSet.fieldByName('跟单进度.实际完成日期').val((new Date()).Format("yyyy-MM-dd"))
            } else {
                self.recordSet.fieldByName('跟单进度.确认日期').val([])
                self.recordSet.fieldByName('跟单进度.实际完成日期').val([])
            }
        }
        //工厂预计交期
        if (cgeField.fullName == '采购跟单.采购预计交期') {
            self.recordSet.tableByName('跟单进度').locate('跟单进度.跟进内容', '工厂交货', true, true, function (iIdx) {
                oTable.cursor(iIdx, true);
                self.recordSet.fieldByName('跟单进度.预计完成日期').val(self.recordSet.fieldByName('采购预计交期').val());
            });
        }
    }
}
addListener([EVT_RECORDSET_AFTER_FIELD_CHANGED], cge_RecordSet_Documentary);