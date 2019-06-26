//---<新记录>
function evt_Customer_New(obj) {
    var self = obj.form;
    if (self.moduleName == '客户资料') {
        if (self.recordSet.fieldByName('客户类别').val().length == 0) {
            self.recordSet.fieldByName('客户类别').val('客户资料');
        }
    } else if (self.moduleName == '客户公海') {
        if (self.recordSet.fieldByName('客户类别').val().length == 0) {
            self.recordSet.fieldByName('客户类别').val('客户公海');
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], evt_Customer_New)

//---<客户公海编辑界面加载完成时_只读未读>
function evt_PublicCustomers_Readonly(obj) {
    var self = obj.form;
    if (self.moduleName == '客户公海') {
        if (self.field) {
            if (self.recordJob != "new" && self.recordJob != "copy") {
                if (self.recordSet.fieldByName("客户等级").val() == "E") {
                    self.field("客户等级").disable();
                } else {
                    self.field("客户等级").enable();
                }
            }
            if (self.recordJob == "new" || self.recordJob == "copy") {
                self.recordSet.fieldByName("客户等级").val("E");
                self.field("客户等级").disable();
            }
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], evt_PublicCustomers_Readonly);

//---<客户公海客户等级change时_只读未读>
function cge_EditForm_PublicCustomers(obj) {
    var self = obj.form;
    var cgeField = obj.field;
    if (self.moduleName == '客户公海') {
        //一个change字段条件时用
        if (cgeField.fullName == '客户公海.客户等级') {
            if (self.recordSet.fieldByName("客户等级").val() == "E") {
                self.field("客户等级").disable();
            } else {
                self.field("客户等级").enable();
            }
        }
    }
}
addListener([EVT_RECORDSET_AFTER_FIELD_CHANGED], cge_EditForm_PublicCustomers);

//---<客户公海_客户等级数据填充>
function evt_PublicCustomers_ButtonClick(obj) {
    var self = obj.form;
    if (self.moduleName == '客户公海') {
        if (obj.fullname == '客户公海.客户等级') {
            self.recordSet.doDataFill('客户等级_编辑', '客户公海.客户等级');
        }
    }
}
addListener([EVT_EDITFORM_FIELD_BUTTONCLICK], evt_PublicCustomers_ButtonClick);

//---<客户公海_保存前事件>
function evt_PublicCustomers_beforeSave(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == "客户公海") {
            //---子表不能为空
            var fnTableNotEmpty = function (callback) {
                if (!self.recordSet.tableByName("联系人").recordCount()) {
                    callback(false);
                } else {
                    callback(true);
                }
            };

            fnTableNotEmpty(function (res) {
                if (res == true) {
                    var sClass = self.recordSet.fieldByName('客户等级').val();
                    var oSQL = _.db.execute('PublicCustomers_Select_PublicCustomers', {
                        "values": {
                            "sRecordID": self.recordSet.fieldByName('rid').val()
                        }
                    });
                    if (oSQL.length > 0 && !_.utils.isNull(oSQL[0].CustomerClass)) {
                        if (sClass.charCodeAt() > oSQL[0].CustomerClass.charCodeAt()) {
                            if (self.field) {
                                _.ui.showWarnning(_.language.get('系统不允许在[客户公海]调低客户等级!'));
                            }
                            self.recordSet.fieldByName('客户等级').val(oSQL[0].CustomerClass);
                        }
                    }
                    resolve();
                } else {
                    if (self.field) {
                        _.ui.showWarnning(_.language.get("子表不能为空!"));
                        reject();
                    } else {
                        resolve();
                    }
                }
            });
        } else {
            resolve();
        }
    });
}
addPromiseListener([EVT_RECORDSET_BEFORE_SAVE], evt_PublicCustomers_beforeSave);

//---<客户公海button>
function btn_PublicCustomers_Claim(obj) {
    var self = obj.form;
    if (self.moduleName == '客户公海') {
        //---<客户公海_认领客户>
        var fnPublicCustomers_Claim = function () {
            var fnApprovalConfig = function () {
                //执行mySQL语句
                var oSQL = _.db.execute('PublicCustomers_Select_Dic_Sales', {
                    "values": {
                        "sSalesMan": sSalesMan
                    }
                });
                if ((oSQL.length == 0) || (oSQL.length > 0 && !oSQL[0].SalesClass) || (oSQL.length > 0 && !oSQL[0].CustomerClassLimit) || (oSQL.length > 0 && !oSQL[0].CustomerQtyLimit)) {
                    _.ui.showWarnning(_.language.get("该用户[业务字典]-客户等级，业务员等级，业务员限制未配置完整，系统将停止操作！"));
                    return;
                } else {
                    sSalesClass = oSQL[0].SalesClass; //---业务员等级
                    iCustomerClassLimit = oSQL[0].CustomerClassLimit.charCodeAt(); //---客户等级上限
                    iCustomerQtyLimit = _.convert.toFloat(oSQL[0].CustomerQtyLimit); //---客户数量上限                                 
                    //执行mySQL语句
                    var oSQL2 = _.db.execute('PublicCustomers_Select_PublicCustomers', {
                        "values": {
                            "sRecordID": sRecordID
                        }
                    });
                    if ((oSQL2.length == 0) || (!oSQL2[0].CustomerClass)) {
                        _.ui.showWarnning(_.language.get("该客户的客户等级未填写，请联系畅想相关工程师处理！"));
                        return;
                    } else {
                        iClass = oSQL2[0].CustomerClass.charCodeAt(); //将字母转码为数字
                        //执行mySQL语句
                        var oSQL2 = _.db.execute('PublicCustomers_Select_Customers', {
                            "values": {
                                "sLoginID": sLoginID
                            }
                        });
                        if (oSQL2.length > 0) {
                            iCustomQty = oSQL2[0].yj ? _.convert.toFloat(oSQL2[0].yj) : 0; //判断yj是否有数据，有则转换为浮点型，无则返回0
                            if (iCustomQty - iCustomerQtyLimit >= 0) {
                                _.ui.showWarnning(_.language.get("该用户客户数量已达到设定上限，系统将停止操作！"));
                                return;
                            } else if (iCustomerClassLimit - iClass > 0) {
                                _.ui.showWarnning(_.language.get("由于您的客户等级上限限制，您还不能领用该客户！"));
                                return;
                            } else {
                                try {
                                    //---认领客户，Salesman=@sSalesMan,cat_id=Null,CustomerCategory='客户资料',mTime=now()
                                    _.db.execute('PublicCustomers_Update_PublicCustomers', {
                                        "values": {
                                            "suid": sLoginID,
                                            "sSalesMan": sSalesMan,
                                            "sRecordID": sRecordID
                                        }
                                    });

                                    //---认领客户，改为未读记录
                                    _.db.execute('PublicCustomers_Update_PublicCustomers_tag', {
                                        "values": {
                                            "sLoginID": sLoginID,
                                            "sRecordID": sRecordID,
                                            "sOldUserID": sOldUserID
                                        }
                                    });

                                    //---认领客户，修改附件列表
                                    _.db.execute('PublicCustomers_Update_sys_document', {
                                        "values": {
                                            "sRecordID": sRecordID,
                                            "sUserID": sLoginID,
                                            "sUserName": sSalesMan
                                        }
                                    });

                                    //---认领客户，修改提醒列表
                                    _.db.execute('PublicCustomers_Update_Sys_Reminder', {
                                        "values": {
                                            "sRecordID": sRecordID,
                                            "sUids": sLoginID
                                        }
                                    });
                                    var myDate = (new Date()).Format("yyyy-MM-dd");
                                    //---认领客户，创建新的认领信息
                                    _.db.execute('PublicCustomers_Insert_CustomersClaim2', {
                                        "values": {
                                            "sCompanyID": sCompanyID,
                                            "sLoginID": sLoginID,
                                            "sRecordID": sRecordID,
                                            "sGuid": _.utils.guid(),
                                            "myDate": myDate,
                                            "sSalesMan": sSalesMan
                                        }
                                    });

                                    _.ui.showInfo(_.language.get("客户已成功认领！"));
                                    if (self.type == "search") {
                                        self.grid.reload(); //重载记录
                                    } else {
                                        self.close();
                                    }
                                } catch (err) {
                                    _.log.error(err.message)
                                }
                            }
                        }
                    }
                }

            };
            //int类型
            var iCustomerQtyLimit = 0;
            var iCustomQty = 0;
            var iClass = 0;
            var iCustomerClassLimit = 0;
            //string类型
            var oUserInfo = _.app.cxUserInfo();
            var sCompanyID = oUserInfo.companyID; //当前登录账套的CompanyID
            var sSalesMan = oUserInfo.userName; //当前登录用户的UserName,注意大小写
            var sLoginID = oUserInfo.recordID; //当前登录用户的UserID
            var sRecordID = self.rid;
            if (self.type == "search") {
                var sOldUserID = self.uid;
            } else {
                var sOldUserID = self.recordSet.fieldByName('uid').val();
            }
            var sSalesClass = '';
            var sRetentionTime = '';
            var sOperator = '';

            if (self.type == "search") {
                if (!self.grid.rowID()) {
                    _.ui.showWarnning(_.language.get("未选中记录！"));
                    return;
                }
            }
            //YesOrNo对话框
            _.ui.yesOrNo(
                _.language.get('是否认领客户！'),
                okfunc = function () {
                    //后7原则保护客户被再次认领
                    var oTxt = {
                        "values": {
                            "sRecordID": sRecordID
                        }
                    }
                    var oSQL = _.db.execute('PublicCustomers_Select_PublicCustomersClaim', oTxt);
                    if (oSQL.length > 0) {
                        //[I]代表数据集中的一条记录，sql[0].Operator表示返回结果集中第一条记录的Operator值
                        sOperator = oSQL[0].Operator;
                        sRetentionTime = _.date.incDay((new Date(oSQL[0].Date)).Format("yyyy-MM-dd"), 7);
                        sToday = (new Date()).Format("yyyy-MM-dd");
                        if ((_.date.dateDiff(sRetentionTime, sToday) > 0) && (sSalesMan == sOperator)) {
                            _.ui.showInfo(_.language.get('该客户被移出您的客户库正处于保护期，请于以下时间进行认领：') + sRetentionTime);
                        } else {
                            _.ui.yesOrNo(
                                _.language.get('该客户将归入您的名下,是否确定执行!'),
                                okfunc = function () {
                                    fnApprovalConfig();
                                }
                            );
                        }
                    } else {
                        _.ui.yesOrNo(
                            _.language.get('该客户将归入您的名下,是否确定执行!'),
                            okfunc = function () {
                                fnApprovalConfig();
                            }
                        );
                    }
                }
            );
        };

        //---<客户公海_批量分配客户>
        var fnPublicCustomers_BatchClaim = function () {
            if (!_.app.permission.checkExtendPermissionIsEnable('允许批量分配客户')) {
                _.ui.showWarnning(_.language.get("您的操作未被授权！"));
                return;
            }
            var aRecordCart = self.recordCart; //购物车选中的记录
            if (aRecordCart.length == 0) {
                _.ui.showWarnning(_.language.get("未选中记录！"));
                return;
            }

            var fnBatchClaim = function (val) {
                var sSalesMan = val;
                var oUserInfo = _.app.cxUserInfo(sSalesMan);
                var sLoginID = oUserInfo.recordID;
                var sCompanyID = oUserInfo.companyID;
                _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i><span class="text"></span>', function (el) {
                    el.css("width", "220px!important");
                    el.css("line-height", "20px");
                    _.utils.processQueue(aRecordCart, function (idx, element) {
                        try {
                            var sRecordID = element;
                            //查询客户原记录所有者
                            var oSQL = _.db.execute('PublicCustomers_Select_UserName', {
                                "values": {
                                    "sRecordID": sRecordID
                                }
                            });
                            var sOldUserID = oSQL[0].uid;
                            //---认领客户，修改记录所有者等信息
                            _.db.execute('PublicCustomers_Update_PublicCustomers', {
                                "values": {
                                    "suid": sLoginID,
                                    "sSalesMan": sSalesMan,
                                    "sRecordID": sRecordID
                                }
                            });

                            //---认领客户，改为未读记录
                            _.db.execute('PublicCustomers_Update_PublicCustomers_tag', {
                                "values": {
                                    "sLoginID": sLoginID,
                                    "sRecordID": sRecordID,
                                    "sOldUserID": sOldUserID
                                }
                            });

                            //---认领客户，修改附件列表
                            _.db.execute('PublicCustomers_Update_sys_document', {
                                "values": {
                                    "sRecordID": sRecordID,
                                    "sUserID": sLoginID,
                                    "sUserName": sSalesMan
                                }
                            });

                            //---认领客户，修改提醒列表
                            _.db.execute('PublicCustomers_Update_Sys_Reminder', {
                                "values": {
                                    "sRecordID": sRecordID,
                                    "sUids": sLoginID
                                }
                            });
                            var myDate = (new Date()).Format("yyyy-MM-dd");
                            //---认领客户，创建新的认领信息
                            _.db.execute('PublicCustomers_Insert_CustomersClaim2', {
                                "values": {
                                    "sCompanyID": sCompanyID,
                                    "sLoginID": sLoginID,
                                    "sRecordID": sRecordID,
                                    "sGuid": _.utils.guid(),
                                    "myDate": myDate,
                                    "sSalesMan": sSalesMan
                                }
                            });
                        } catch (err) {
                            _.log.error(err.message)
                        }
                        el.find(".text").html(_.language.get("正在操作") + '！<br/>(' + _.language.get("第") + idx + _.language.get("条") + '，' + _.language.get("共") + aRecordCart.length + _.language.get("条") + '！)');
                    }, function () {
                        _.ui.closeWatting();
                        _.ui.showInfo(_.language.get("客户已成功认领！"));
                        self.clearRecordCart();
                        if (self.type == "search") {
                            self.grid.reload(); //重载记录
                        }
                    });
                });
            }
            _.ui.showInput({
                title: _.language.get('请选择将客户给:'),
                type: "dropdown",
                fields: window.intersky.aAllUserList,
                value: "",
                onapprove: function (val) {
                    fnBatchClaim(val);
                }
            });
        };

        if (self.addButton) {
            self.addButton("bExtend", _.language.get("扩展"), "", "yelp", true, true); //下拉菜单
            self.button('bExtend').addButton("bClaimCustomer", _.language.get("认领客户"), function () {
                if (obj.evtID == EVT_SEARCHFORM_CREATED || ((obj.evtID == EVT_EDITFORM_CREATED || obj.evtID == EVT_RECORDSET_AFTER_NEW || obj.evtID == EVT_RECORDSET_AFTER_COPY || obj.evtID == EVT_EDITFORM_AFTER_SCROLL) && self.modified == false)) {
                    fnPublicCustomers_Claim();
                } else {
                    _.ui.showWarnning(_.language.get('记录未保存，系统停止操作！'));
                }
            });
            self.button('bExtend').addButton("bBatchClaimCustomer", _.language.get("批量分配客户"), function () {
                if (obj.evtID == EVT_SEARCHFORM_CREATED) {
                    fnPublicCustomers_BatchClaim();
                }
            });
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY, EVT_SEARCHFORM_CREATED], btn_PublicCustomers_Claim);

//---<客户资料button>
function btn_Customers(obj) {
    var self = obj.form;
    if (self.moduleName == '客户资料') {
        //---<客户资料_释放客户>
        var fnCustomers_Release = function () {
            var fnDoit = function () {
                try {
                    //---Salesman=@sSalesMan,cat_id=Null,CustomerCategory='客户公海',mTime=now()
                    _.db.execute('Customers_Update_Customers2', {
                        "values": {
                            "sRecordID": sRecordID
                        }
                    });

                    //---认领客户，创建新的认领信息
                    var dmyDate = (new Date()).Format("yyyy-MM-dd");
                    _.db.execute('Customers_Insert_PublicCustomersClaim2', {
                        "values": {
                            "sCompanyID": sCompanyID,
                            "sLoginID": sLoginID,
                            "sRecordID": sRecordID,
                            "sGuid": _.utils.guid(),
                            "dmyDate": dmyDate,
                            "sSalesMan": sSalesMan
                        }
                    });

                    _.ui.showInfo(_.language.get("客户已成功移除！"));
                    if (self.type == "search") {
                        self.grid.reload(); //重载记录
                    } else {
                        self.close();
                    }
                } catch (err) {
                    _.log.error(err.message)
                }
            };
            var sRecordID = self.rid;
            var sOldUserID;
            if (self.type == "search") {
                sOldUserID = self.uid;
            } else {
                sOldUserID = self.recordSet.fieldByName('uid').val();
            }
            var oUserInfo = _.app.cxUserInfo();
            var sCompanyID = oUserInfo.companyID;
            var sLoginID = oUserInfo.recordID;
            var sSalesMan = oUserInfo.userName; //注意大小写
            if (sLoginID == sOldUserID) {
                _.ui.yesOrNo(
                    _.language.get('是否移出客户至客户公海！'),
                    okfunc = function () {
                        var oSQL = _.db.execute('Customers_Select_Customer2', {
                            "values": {
                                "sRecordID": sRecordID
                            }
                        });
                        if (oSQL.length > 0) {
                            _.ui.yesOrNo(
                                _.language.get('该客户已是成交客户，是否确定执行！'),
                                okfunc = function () {
                                    fnDoit();
                                }
                            );
                        } else {
                            fnDoit();
                        }
                    });
            } else {
                _.ui.showInfo(_.language.get("您的操作未被授权！"));
            }
        };

        //---<客户资料_批量释放客户>
        var fnCustomers_BatchRelease = function () {
            if (!_.app.permission.checkExtendPermissionIsEnable('允许批量释放客户')) {
                _.ui.showWarnning(_.language.get("您的操作未被授权！"));
                return;
            }
            var aRecordCart = self.recordCart; //购物车选中的记录
            if (aRecordCart.length == 0) {
                _.ui.showWarnning(_.language.get("未选中记录！"));
                return;
            }
            var dUserInfo = _.app.cxUserInfo();
            var fnBatchDoit = function () {
                _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i><span class="text"></span>', function (el) {
                    el.css("width", "220px!important");
                    el.css("line-height", "20px");
                    _.utils.processQueue(aRecordCart, function (idx, element) {
                        try {
                            var sRecordID = element;

                            //---cat_id=Null,CustomerCategory='客户公海',mTime=now()
                            _.db.execute('Customers_Update_Customers2', {
                                "values": {
                                    "sRecordID": sRecordID
                                }
                            });
                            //---释放客户，创建新的认领信息
                            var dmyDate = (new Date()).Format("yyyy-MM-dd");
                            _.db.execute('Customers_Insert_PublicCustomersClaim2', {
                                "values": {
                                    "sCompanyID": dUserInfo.companyID,
                                    "sLoginID": dUserInfo.recordID,
                                    "sRecordID": element,
                                    "sGuid": _.utils.guid(),
                                    "dmyDate": dmyDate,
                                    "sSalesMan": dUserInfo.userName
                                }
                            });
                        } catch (err) {
                            _.log.error(err.message)
                        }
                        el.find(".text").html(_.language.get("正在操作") + '！<br/>(' + _.language.get("第") + idx + _.language.get("条") + '，' + _.language.get("共") + aRecordCart.length + _.language.get("条") + '！)');
                    }, function () {
                        _.ui.closeWatting();
                        self.clearRecordCart(); //清空购物车
                        _.ui.showInfo(_.language.get("客户已成功释放！"));
                        if (self.type == "search") {
                            self.grid.reload(); //重载记录
                        }
                    });
                });
            }
            _.ui.yesOrNo(
                _.language.get('是否移出客户至客户公海！'),
                okfunc = function () {
                    fnBatchDoit();
                });
        }

        //---<客户资料_给客户推荐产品>
        var fnCustomer_Recommend = function () {
            if (!_.app.permission.getModulePermission('产品推荐')) {
                _.ui.showWarnning(_.language.get("您的操作未被授权！"));
                return;
            }
            if (self.type == 'edit') {
                var sCustomerNo, sCustomerShortName, sName, sEmail;
                sCustomerNo = self.recordSet.fieldByName('客户编号').val();
                sCustomerShortName = self.recordSet.fieldByName('客户简称').val();
                sName = self.recordSet.fieldByName('联系人.姓名').val();
                sEmail = self.recordSet.fieldByName('联系人.电子邮件').val();

                _.app.ui.openEditor('new', '产品推荐', '', function (oEditor) {
                    _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>' + _.language.get("正在导入数据，请等待！"), function () {
                        var oTable = oEditor.recordSet.tableByName('收件资料');
                        oTable.append();
                        oEditor.recordSet.fieldByName('收件资料.客户简称').val(sCustomerShortName);
                        oEditor.recordSet.fieldByName('收件资料.姓名').val(sName);
                        oEditor.recordSet.fieldByName('收件资料.电子邮件').val(sEmail);
                        _.ui.closeWatting();
                    });
                });
            } else if (self.type == 'search') {
                var aRecords = [];
                var aCustoms = [];
                var aNames = [];
                var aEmails = [];
                if (self.grid.getSelectedRows().length == 0) {
                    aRecords.push(self.rid);
                } else {
                    for (var i = 0; i < self.grid.getSelectedRows().length; i++) {
                        aRecords.push(self.getID("rid", i)); //通过对应行号取得rid存入数组
                    }
                }
                for (var i in aRecords) {
                    var oSQL = _.db.execute('Customers_Select_CustomerContacts', {
                        "values": {
                            "sRecordID": aRecords[i]
                        }
                    });
                    if (oSQL.length > 0) {
                        aCustoms.push(oSQL[0].CustomerShortName);
                        aNames.push(oSQL[0].Name);
                        aEmails.push(oSQL[0].Email);
                    }
                }

                _.app.ui.openEditor('new', '产品推荐', '', function (oEditor) {
                    _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i><span class="text"></span>', function (el) {
                        var oTable = oEditor.recordSet.tableByName('收件资料');
                        oTable.disableControl();
                        el.css("width", "220px!important");
                        el.css("line-height", "20px");
                        _.utils.processQueue(aCustoms, function (idx, element) {
                            oTable.append();
                            oEditor.recordSet.fieldByName("收件资料.客户简称").val(element);
                            oEditor.recordSet.fieldByName("收件资料.姓名").val(aNames[i - 1]);
                            oEditor.recordSet.fieldByName("收件资料.电子邮件").val(aEmails[i - 1]);
                            el.find(".text").html(_.language.get("正在操作") + '！<br/>(' + _.language.get("第") + idx + _.language.get("条") + '，' + _.language.get("共") + aCustoms.length + _.language.get("条") + '！)');
                        }, function () {
                            oTable.enableControl('Batch_Customer');
                            _.ui.closeWatting();
                        });
                    });
                });
            }
        };

        //---<客户资料_给客户寄样>
        var fnCustomers_samplesToCustomers = function () {
            if (!_.app.permission.getModulePermission('客户寄样')) {
                _.ui.showWarnning(_.language.get("您的操作未被授权！"));
                return;
            }
            var sRecordID;
            if (self.type == 'search') {
                sRecordID = self.rid;
            } else {
                sRecordID = self.recordSet.fieldByName('rid').val();
            }
            var sValue;
            var oSQL = _.db.execute('Customers_Select_Customers1', {
                "values": {
                    "sRecordID": sRecordID
                }
            });
            if (oSQL.length > 0) {
                sValue = oSQL[0].CustomerNo ? oSQL[0].CustomerNo : '';
            }
            if (sValue) {
                _.app.ui.openEditor('new', '寄样管理', '', function (oEditor) {
                    _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>' + _.language.get("正在导入数据，请等待！"), function () {
                        oEditor.recordSet.fieldByName('伙伴编号').val(sValue);
                        oEditor.recordSet.fieldByName('寄样对象').val('客户');
                        _.ui.closeWatting();
                    });
                });
            }
        };

        //---<客户资料_给客户报价>
        var fnCustomers_QuoteToCustomer = function () {
            if (!_.app.permission.getModulePermission('客户报价')) {
                _.ui.showWarnning(_.language.get("您的操作未被授权！"));
                return;
            }
            var sRecordID;
            if (self.type == 'search') {
                sRecordID = self.rid;
            } else {
                sRecordID = self.recordSet.fieldByName('rid').val();
            }
            var sValue;
            var oSQL = _.db.execute('Customers_Select_Customers1', {
                "values": {
                    "sRecordID": sRecordID
                }
            });
            if (oSQL.length > 0) {
                sValue = oSQL[0].CustomerNo ? oSQL[0].CustomerNo : '';
            }
            if (sValue) {
                _.app.ui.openEditor('new', '客户报价', '', function (oEditor) {
                    _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>' + _.language.get("正在导入数据，请等待！"), function () {
                        oEditor.recordSet.fieldByName('客户编号').val(sValue);
                        _.ui.closeWatting();
                    });
                });
            }
        };

        //---<客户资料_给客户做合同>
        var fnCustomers_SalesOrdersToCustomer = function () {
            if (!_.app.permission.getModulePermission('销售合同')) {
                _.ui.showWarnning(_.language.get("您的操作未被授权！"));
                return;
            }
            var sRecordID;
            if (self.type == 'search') {
                sRecordID = self.rid;
            } else {
                sRecordID = self.recordSet.fieldByName('rid').val();
            }
            var sValue;
            var oSQL = _.db.execute('Customers_Select_Customers1', {
                "values": {
                    "sRecordID": sRecordID
                }
            });
            if (oSQL.length > 0) {
                sValue = oSQL[0].CustomerNo ? oSQL[0].CustomerNo : '';
            }
            if (sValue) {
                _.app.ui.openEditor('new', '销售合同', '', function (oEditor) {
                    _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>' + _.language.get("正在导入数据，请等待！"), function () {
                        oEditor.recordSet.fieldByName('客户编号').val(sValue);
                        _.ui.closeWatting();
                    });
                });
            }
        };
        if (self.addButton) {
            self.addButton("bExtend", _.language.get("扩展"), "", "yelp", true, true); //下拉菜单
            if (window.aconfig && window.aconfig.PublicCustomers_PublicCheck) {
                self.button('bExtend').addButton("bReleaseCustomer", _.language.get("释放客户"), function () {
                    if (obj.evtID == EVT_SEARCHFORM_CREATED || (obj.evtID == EVT_EDITFORM_CREATED && self.modified == false)) {
                        fnCustomers_Release();
                    } else {
                        _.ui.showWarnning(_.language.get('记录未保存，系统停止操作！'));
                    }
                });
                self.button('bExtend').addButton("bBatchReleaseCustomer", _.language.get("批量释放客户"), function () {
                    if (obj.evtID == EVT_SEARCHFORM_CREATED) {
                        fnCustomers_BatchRelease();
                    }
                });
            }
            self.button('bExtend').addButton("bRecommend", _.language.get("给客户推荐产品"), function () {
                fnCustomer_Recommend();
            });

            self.button('bExtend').addButton("samplesToCustomers", _.language.get("给客户寄样"), function () {
                fnCustomers_samplesToCustomers();
            });

            self.button('bExtend').addButton("QuoteToCustomer", _.language.get("给客户报价"), function () {
                fnCustomers_QuoteToCustomer();
            });

            self.button('bExtend').addButton("SalesOrdersToCustomer", _.language.get("给客户做合同"), function () {
                fnCustomers_SalesOrdersToCustomer();
            }, 'browser icon');
        }

    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY, EVT_SEARCHFORM_CREATED], btn_Customers);

//---<客户资料_联系日志_联系时间>
function evt_Customers_Contact(obj) {
    var self = obj.form;
    if (self.moduleName == '客户资料') {
        var srid = self.recordSet.fieldByName('rid').val();
        var iDiff = 0;
        var oTxt = {
            "values": {
                "sRecordID": srid
            }
        }
        var oSQL = _.db.execute('Customers_Select_CustomersContactRecords_Customers', oTxt);
        if (oSQL.length > 0) {
            iDiff = _.convert.toInteger(oSQL[0].DiffDate) ? _.convert.toInteger(oSQL[0].DiffDate) : 0;
            if (iDiff > 0 || _.utils.isNull(oSQL[0].DiffDate)) {
                _.db.execute('Customers_Update_Customers', {
                    "values": {
                        "dLastContactSent": oSQL[0].yj,
                        "sRecordID": srid
                    }
                });
            }
        }
    }
}
addListener([EVT_RECORDSET_AFTER_SAVE], evt_Customers_Contact);

//---<客户资料_预计释放日期>
function evt_Customers_ReleaseDate(obj) {
    var self = obj.form;
    if (self.moduleName == '客户资料') {
        if (self.field) {
            if (self.recordSet.fieldByName('最近成交').val().length == 0) {
                self.field('预计释放日期').show();
            } else {
                self.field('预计释放日期').hide();
            }
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], evt_Customers_ReleaseDate);

//---<客户资料_保存前事件>
function evt_Customers_beforeSave(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == "客户资料") {
            //---子表不能为空
            if (!self.recordSet.tableByName("联系人").recordCount() && self.field) {
                _.ui.showInfo(_.language.get('子表不能为空!'));
                reject();
            } else {
                resolve();
            }
        } else {
            resolve();
        }
    });
}
addPromiseListener([EVT_RECORDSET_BEFORE_SAVE], evt_Customers_beforeSave);

//---<客户资料_记录复制>
function evt_Customers_aftercopy(obj) {
    var self = obj.form;
    if (self.moduleName == "客户资料" || self.moduleName == "客户公海") {
        self.recordSet.fieldByName('建档时间').val((new Date()).Format("yyyy-MM-dd hh:mm:ss"));
        self.recordSet.fieldByName('最近联系(发送)').val('');
        self.recordSet.fieldByName('最近联系(接收)').val('');
        self.recordSet.fieldByName('最近推荐').val('');
        self.recordSet.fieldByName('最近寄样').val('');
        self.recordSet.fieldByName('最近报价').val('');
        self.recordSet.fieldByName('最近成交').val('');
        self.recordSet.fieldByName('预计释放日期').val('');
        self.recordSet.fieldByName('销售总额').val(0);
        self.recordSet.fieldByName('出货总额').val(0);
        self.recordSet.fieldByName('收汇总额').val(0);
        self.recordSet.tableByName('认领信息').clear();
    }
}
addListener([EVT_RECORDSET_AFTER_COPY], evt_Customers_aftercopy);