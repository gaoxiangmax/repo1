var fnPurchasePlans_PurchaseOrderNo = function (self) {
    var oTable = self.recordSet.tableByName('采购明细');
    var sPurchasePlanNo = self.recordSet.fieldByName('采购计划').val();
    var iRecords = oTable.recordCount();
    var oModule = oTable.data;
    var aParams = []; //用于存放参数数组
    for (var i = 0; i < iRecords; i++) {
        oTable.cursor(i, false);
        var oTxt = {
            "values": {
                "sPurchasePlanNo": sPurchasePlanNo,
                "sSupplierNo": self.recordSet.fieldByName('采购明细.厂商编号').val(),
                "sItemNo": self.recordSet.fieldByName('采购明细.产品编号').val(),
                "sSOL_RecordID": self.recordSet.fieldByName('采购明细.产品标识').val()
            }
        };
        aParams.push(oTxt);
    }
    //将拼接好的aParams作为参数批量提交数据库查询，提高效率
    var oSQL = _.db.execute('PurchasePlans_Select_PurchasePlans_PurchasePlansDelivery3', aParams);
    var aParams = [];
    if (oSQL.length > 0) {
        for (var i in oSQL) {
            if (oSQL[i].length > 0) {
                var sPurchaseOrderNo = oSQL[i][0].PurchaseOrderNo
            } else {
                var sPurchaseOrderNo = '';
            }
            oTable.cursor(i, false);
            var oTxt = {
                "values": {
                    "sPurchaseOrderNo": sPurchaseOrderNo,
                    "srid": self.recordSet.fieldByName('采购明细.rid').val()
                }
            };
            aParams.push(oTxt);
            //修改界面的采购明细-采购合同
            oModule[i]["PurchaseOrderNo"] = sPurchaseOrderNo;
            self.field('采购计划.采购明细.采购合同').setValue(sPurchaseOrderNo);
        }
    }
    //将拼接好的aParams作为参数批量提交数据库修改采购明细-采购合同，提高效率
    _.db.execute('PurchasePlans_Update_PurchasePlansDelivery_PurchaseOrderNo', aParams);
}

//---<采购计划_采购交期>
function cge_RecordSet_PurchasePlans(obj) {
    var self = obj.form;
    var cgeField = obj.field;
    if (self.moduleName == '采购计划') {
        if (cgeField.fullName == '采购计划.交货日期') {
            if (self.recordSet.fieldByName('交货日期').val()) {
                self.recordSet.fieldByName('采购交期').val(_.date.incDay((new Date(self.recordSet.fieldByName('交货日期').val())).Format("yyyy-MM-dd"), -7));
            }
        }
    }
}
addListener([EVT_RECORDSET_AFTER_FIELD_CHANGED], cge_RecordSet_PurchasePlans);

function btn_PurchasePlans(obj) {
    var self = obj.form;
    if (self.moduleName == '采购计划') {
        //---<采购计划_一次性下单生成采购合同>
        var fnPurchasePlans_AutoPurchaseOrder = function () {
            var aUserNameList = [];
            var sPurchasePlanNo;
            var bAutomatic;
            var srid = self.rid;
            if (self.modified) {
                _.ui.showWarnning(_.language.get('记录未保存，系统停止操作！'));
                return;
            }
            var oSQL = _.db.execute('PurchasePlans_Select_PurchasePlans_PurchasePlansDelivery', {
                "values": {
                    "srid": srid
                }
            });
            if (oSQL.length == 0) {
                _.ui.showWarnning(_.language.get('采购明细无数据，无法完成生成采购合同操作！'));
                return;
            } else {
                for (var i in oSQL) {
                    if (oSQL[i].PurchaseUserName && oSQL[i].SupplierNo) {
                        continue;
                    } else {
                        _.ui.showWarnning(_.language.get('[分配采购员][厂商编号]不能为空，请检查采购明细！'));
                        return;
                    }
                }
            }
            //Q系配置
            if (window.aconfig && window.aconfig.PurchasePlans_AutoNoCheck) {
                bAutomatic = true;
            } else {
                bAutomatic = false;
            }
            VLIB.cxAutoData(self, srid, '采购计划.采购计划', '采购合同.采购计划', '采购计划.采购明细.厂商编号;采购计划.采购明细.分配采购员', '采购合同.厂商编号;采购合同.采购员', '采购合同.采购合同', false, bAutomatic, function (res) {
                setTimeout(function () {
                    try {
                        if (window.bAutoData && window.bAutoData == false) {
                            var oSQL = _.db.execute('PurchasePlans_Select_PurchasePlans_PurchasePlansDelivery2', {
                                "values": {
                                    "srid": srid
                                }
                            });
                            sPurchasePlanNo = oSQL[0].PurchasePlanNo;
                            if (oSQL.length > 0) {
                                for (var i in oSQL) {
                                    if (aUserNameList.indexOf(oSQL[i].PurchaseUserName) < 0) {
                                        aUserNameList.push(oSQL[i].PurchaseUserName);
                                        sPurchasePlanNo = sPurchasePlanNo;
                                    }
                                }
                            }
                            if (aUserNameList.length > 1) {
                                _.ui.yesOrNo(
                                    _.language.get('是否通知分配采购员!'),
                                    okfunc = function () {
                                        VLIB.cxSendInTimeMessage(aUserNameList, '采购计划：' + sPurchasePlanNo + ' 已经生成采购合同，请查看', true);
                                    }
                                );
                            } else if (aUserNameList.length == 1) {
                                if (aUserNameList[0] != _.app.cxUserInfo().userName) {
                                    VLIB.cxSendInTimeMessage(aUserNameList, '采购计划：' + sPurchasePlanNo + ' 已经生成采购合同，请查看', true);
                                }
                            }
                            delete window.bAutoData;
                        }
                    } catch (err) {
                        _.ui.showError(_.language.get('[分配采购员][厂商编号]不能为空，请检查采购明细！'));
                    }

                    //更新采购明细-采购合同
                    if (self.type == 'edit') {
                        var oTable = self.recordSet.tableByName('采购明细');
                        var iRecords = oTable.recordCount();
                        var oModule = oTable.data;
                        for (var i = 0; i < iRecords; i++) {
                            oTable.cursor(i, true);
                            var oSQL = _.db.execute('PurchasePlans_Select_PurchasePlans_PurchasePlansDelivery3', {
                                "values": {
                                    "sPurchasePlanNo": sPurchasePlanNo,
                                    "sSupplierNo": self.recordSet.fieldByName('采购明细.厂商编号').val(),
                                    "sItemNo": self.recordSet.fieldByName('采购明细.产品编号').val(),
                                    "sSOL_RecordID": self.recordSet.fieldByName('采购明细.产品标识').val()
                                }
                            });
                            if (oSQL.length == 0) {
                                _.db.execute('PurchasePlans_Update_PurchasePlansDelivery_PurchaseOrderNo', {
                                    "values": {
                                        "sPurchaseOrderNo": '',
                                        "srid": self.recordSet.fieldByName('采购明细.rid').val()
                                    }
                                });
                                oModule[i]["PurchaseOrderNo"] = '';
                                self.field('采购计划.采购明细.采购合同').setValue('');
                            } else {
                                _.db.execute('PurchasePlans_Update_PurchasePlansDelivery_PurchaseOrderNo', {
                                    "values": {
                                        "sPurchaseOrderNo": oSQL[0].PurchaseOrderNo,
                                        "srid": self.recordSet.fieldByName('采购明细.rid').val()
                                    }
                                });
                                oModule[i]["PurchaseOrderNo"] = oSQL[0].PurchaseOrderNo;
                                self.field('采购计划.采购明细.采购合同').setValue(oSQL[0].PurchaseOrderNo);
                            }
                        }
                    } else {
                        _.db.execute('PurchasePlans_Update_PurchasePlansDelivery_PurchaseOrderNo_Search', {
                            "values": {
                                "srid": self.rid
                            }
                        });
                    }
                }, 1000);
            });
        };

        //---<采购计划_分批次下单生成采购合同>
        var fnPurchasePlans_PartialPurchaseOrder = function () {
            var aOrderNo = [];
            var bAutomatic;
            var sPurchasePlanNo;
            var iSupplierAgentIndex, iNum;
            //CheckPermission预留
            var sTargetMouleName = '采购合同';
            var oModulePermission = _.app.permission.getModulePermission(sTargetMouleName);
            if (!oModulePermission.new) {
                _.ui.showWarnning('[' + sTargetMouleName + '],' + _.language.get('您没有新建该模块的权限！'));
                return;
            }
            iSupplierAgentIndex = 0;
            sRecordID = self.recordSet.fieldByName('rid').val();
            sPurchasePlanNo = self.recordSet.fieldByName('采购计划').val(); //---取采购计划单号
            // 执行分批采购前先检查采购明细的产品是否在[采购合同]中被删除，否则将漏单
            var bResult = false;
            var oTable = self.recordSet.tableByName('采购明细');
            oTable.disableControl();
            var iBookMark = oTable.cursor();
            oTable.cursor(0, false);
            try {
                oTable.down(function () {
                    var oSQL = _.db.execute('PurchasePlans_Select_PurchasePlans_PurchasePlansDelivery3', {
                        "values": {
                            "sPurchasePlanNo": sPurchasePlanNo,
                            "sSupplierNo": self.recordSet.fieldByName('采购明细.厂商编号').val(),
                            "sItemNo": self.recordSet.fieldByName('采购明细.产品编号').val(),
                            "sSOL_RecordID": self.recordSet.fieldByName('采购明细.产品标识').val()
                        }
                    });
                    if (oSQL.length == 0) {
                        self.recordSet.fieldByName('采购明细.采购合同').val('');
                        bResult = true;
                    } else {
                        if (self.recordSet.fieldByName('采购明细.采购合同').val().length > 0 && self.recordSet.fieldByName('采购明细.采购合同').val() != oSQL[0].PurchaseOrderNo) {
                            self.recordSet.fieldByName('采购明细.采购合同').val(oSQL[0].PurchaseOrderNo);
                            bResult = true;
                        }
                    }
                });
            } finally {
                oTable.cursor(iBookMark, true);
                oTable.enableControl('Batch_PurchasePlans');
                if (self.modified && bResult) {
                    self.UIsave(false);
                }
            }
            // 判定[采购明细]是否选中进行分批下单的记录
            var aSelected = self.table('采购明细').getSelects();
            if (aSelected.length == 0) {
                _.ui.showWarnning(_.language.get('未选中记录！'));
                return;
            }

            // 判断选中的记录是否已经已生成采购合同
            var aChooseRows = []; //存选中行
            var sPurchaseOrderNos = '';
            var iBookMark = oTable.cursor();
            for (var i in aSelected) {
                oTable.cursor(aSelected[i], false);
                var srid = self.recordSet.fieldByName('采购明细.rid').val();
                var oSQL = _.db.execute('PurchasePlans_Select_PurchasePlans_PurchasePlansDelivery4', {
                    "values": {
                        "srid": srid
                    }
                });
                if (oSQL.length == 0) {
                    var sChooseRows = {
                        "sSupplierNo": self.recordSet.fieldByName('采购明细.厂商编号').val(),
                        "sPurchaseUserName": self.recordSet.fieldByName('采购明细.分配采购员').val(),
                        "sItemNo": self.recordSet.fieldByName('采购明细.产品编号').val(),
                        "sRecordID": self.recordSet.fieldByName('采购明细.产品标识').val(),
                        "sSupplierNoPurchaseUserName": self.recordSet.fieldByName('采购明细.厂商编号').val() + self.recordSet.fieldByName('采购明细.分配采购员').val(),
                        "srid": srid
                    };
                    aChooseRows.push(sChooseRows);
                } else {
                    sPurchaseOrderNos = sPurchaseOrderNos + '[' + oSQL[0].PurchaseOrderNo + ']';
                }
            }
            oTable.cursor(iBookMark, true);
            if (aChooseRows.length == 0) {
                _.ui.showWarnning(_.language.get('选中记录皆已生成采购合同，系统将终止操作！'));
                return;
            } else {
                if (sPurchaseOrderNos.length > 0) {
                    _.ui.Message({
                        msg: sPurchaseOrderNos + _.language.get('已生成[采购合同]！'),
                        center: "center", //居中
                        autoClose: false, //是否自动关闭
                        showClose: true, //是否显示关闭按钮
                        type: 3, //success/warning/info/error分别用1，2，3，4表示
                        closeTime: 5000 //自动关闭时间
                    })
                }
                _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>' + _.language.get('正在操作') + '！', function () {
                    //按工厂编号和分配采购员分组数据
                    var oMap = {};
                    var aGroupRows = [];
                    for (var i = 0; i < aChooseRows.length; i++) {
                        var oRow = aChooseRows[i];
                        if (!oMap[oRow.sSupplierNoPurchaseUserName]) {
                            aGroupRows.push({
                                sSupplierNoPurchaseUserName: oRow.sSupplierNoPurchaseUserName,
                                sSupplierNo: oRow.sSupplierNo,
                                sPurchaseUserName: oRow.sPurchaseUserName,
                                data: [oRow]
                            });
                            oMap[oRow.sSupplierNoPurchaseUserName] = oRow;
                        } else {
                            for (var j = 0; j < aGroupRows.length; j++) {
                                var oData = aGroupRows[j];
                                if (oData.sSupplierNoPurchaseUserName == oRow.sSupplierNoPurchaseUserName) {
                                    oData.data.push(oRow);
                                    break;
                                }
                            }
                        }
                    }
                    //按工厂编号和分配采购员分组数据

                    //Q系配置
                    if (window.aconfig && window.aconfig.PurchasePlans_AutoNoCheck) {
                        bAutomatic = true;
                    } else {
                        bAutomatic = false;
                    }
                    if (!bAutomatic) {
                        // 查询该采购计划下按倒序查询采购合同
                        var oSQL2 = _.db.execute('PurchasePlans_Select_PurchaseOrders3', {
                            "values": {
                                "sPurchasePlanNo": sPurchasePlanNo
                            }
                        });
                        if (oSQL2.length == 0) {
                            //---没有该采购计划的任何采购合同时，采购合同编号=采购计划编号
                            iNum = 0;
                        } else {
                            //---当采购计划对应采购合同多条时，取流水号排序取最大+1给新增的采购合同号
                            for (var i in oSQL2) {
                                var sPOrderNo = oSQL2[i].PurchaseOrderNo;
                                var iSNO = sPOrderNo.substr(sPurchasePlanNo.length + 1, sPOrderNo.length - sPurchasePlanNo.length - 1);
                                aOrderNo.push(iSNO); //将已有采购合同的流水号存入数组，已被排序获取最大流水号                                          
                            }
                            aOrderNo = VLIB.cxShellSort(aOrderNo); //使用希尔算法排序
                            iNum = aOrderNo[aOrderNo.length - 1]; //最大流水号
                        }
                    } else {
                        iNum = -1;
                    }

                    //--------------------------------------------------------将生成的采购合同号同步至采购计划开始--------------------------------------------------------
                    var fnGetPurchaseOrderNo = function (callback) {
                        for (var i in aChooseRows) {
                            var oSQL = _.db.execute('PurchasePlans_Select_PurchaseOrders2', {
                                "values": {
                                    "sSOL_RecordID": aChooseRows[i].sRecordID,
                                    "sSupplierNo": aChooseRows[i].sSupplierNo,
                                    "sItemNo": aChooseRows[i].sItemNo,
                                    "sPurchasePlanNo": sPurchasePlanNo
                                }
                            });
                            oTable = self.recordSet.tableByName("采购明细");
                            if (oSQL.length > 0) {
                                oTable.locate('采购明细.rid', aChooseRows[i].srid, true, false, function (iIdx) {
                                    oTable.cursor(iIdx, true); //第二个参数true-表示界面同步游标，false-表示界面不同步游标
                                    self.recordSet.fieldByName('采购明细.采购合同').val(oSQL[0].PurchaseOrderNo);
                                });
                            }
                        }
                        callback(true);
                    }
                    //--------------------------------------------------------将生成的采购合同号同步至采购计划结束--------------------------------------------------------

                    //--------------------------------------------------------------分批新建或追加合同开始--------------------------------------------------------------
                    //fnNewOrAdd()为业务逻辑函数，用于判断新建或追加逻辑；fnNewRcord()被fnNewOrAdd()调用，用作新建记录；
                    //可把fnjudge()理解为递归用法的变种，因为js中for循环过程中是卡不住程序的，如循环过程中，需要弹出对话框让用户选择合同号并追加，由于机制原因，此时for循环已结束。
                    //因此，你获取的数据一定是循环的最后一组数据，体现在[采购合同]里就是不管是追加还是新建，所有的数据都是重复的。此时，就需要使用递归或者fnjudge()这种手动循环的方式。
                    //手动循环的业务逻辑：1.fnNewOrAdd(aGroupRows.pop());手动执行第一组数据；
                    //2.在追加保存的回调函数或新建保存的回调函数里都调用fnjudge()来取得并删除记录集的最后一组数据去执行fnNewOrAdd(aGroupRows.pop());
                    //3.如此反复，直到aGroupRows用完为止。
                    var fnNewOrAdd = function (oRow) {
                        var fnNewRcord = function (sCondition) {
                            //声明函数，厂商编号+采购员的采购合同已存在，且未涉及审批，否则一律新建合同
                            try {
                                _.app.ui.createEditor({
                                    moduleName: "采购合同",
                                    onInit: function (oEditor) {
                                        var oTable = oEditor.recordSet.tableByName('产品资料');
                                        oEditor.recordSet.fieldByName('采购计划').val(sPurchasePlanNo);
                                        if (iNum >= 0) {
                                            iNum++; //流水号
                                            var sPurchaseOrderNo = sPurchasePlanNo + '-' + iNum;
                                            oEditor.recordSet.fieldByName('采购合同').val(sPurchaseOrderNo);
                                        }
                                        oEditor.recordSet.fieldByName('厂商编号').val(sCondition.sSupplierNo);
                                        oEditor.recordSet.fieldByName('采购员').val(sCondition.sPurchaseUserName);
                                        oTable.clear();
                                        var oData = sCondition.data;
                                        for (var i in oData) {
                                            oTable.append();
                                            oEditor.recordSet.fieldByName('产品资料.产品编号').val(oData[i].sItemNo);
                                            oEditor.recordSet.fieldByName('产品资料.产品标识').val(oData[i].sRecordID);
                                        }
                                        oEditor.save(false, function (oRecord) {
                                            if (oRecord) {
                                                fnjudge();
                                            }
                                        });
                                    },
                                    onError: function (err) {
                                        if (err) {
                                            _.log.error('新建记录失败！');
                                        }
                                    },
                                    async: true
                                });
                            } catch (err) {
                                _.ui.showWarnning(_.language.get('新建采购合同失败！'));
                            }
                        };

                        // 符合分批下单的采购明细记录
                        var aPurchaseOrderNoList = [];
                        var aPurchaseRecordIDlist = [];
                        var sSupplierNo_PurchaseUserName = oRow.sSupplierNo + oRow.sPurchaseUserName;
                        var oSQL = _.db.execute('PurchasePlans_Select_PurchaseOrders', {
                            "values": {
                                "sPurchasePlanNo": sPurchasePlanNo,
                                "yj": sSupplierNo_PurchaseUserName
                            }
                        });
                        if (oSQL.length > 0) {
                            for (var j in oSQL) {
                                //---判断符合条件的采购合同是否涉及审批
                                var oSQL2 = _.db.execute('PurchasePlans_Select_sys_workflow_instance', {
                                    "values": {
                                        "sRecordID": oSQL[j].rid ? oSQL[j].rid : '',
                                    }
                                });
                                if (oSQL2.length == 0) {
                                    // 将符合追加条件的合同号添加至数组中，剔除归档、审批的记录
                                    var sModuleName = "采购合同";
                                    var sPurchaserid = oSQL[j].rid;
                                    var bArchived = _.db.utils.queryArchived(sModuleName, sPurchaserid);
                                    var iWorkflowState = VLIB.cxCheckWorkflowState(sModuleName, sPurchaserid);
                                    if (bArchived == false && iWorkflowState == -1) {
                                        aPurchaseOrderNoList.push(oSQL[j].PurchaseOrderNo);
                                        aPurchaseRecordIDlist.push(oSQL[j].rid);
                                    }
                                }
                            }
                        }
                        // 若符合追加合同，则询问，否则新建记录
                        if (aPurchaseOrderNoList.length > 0) {
                            _.ui.yesOrNo(
                                oRow.sPurchaseUserName + '/' + oRow.sSupplierNo + _.language.get('已存在[采购合同]，是否向原有采购合同追加?'),
                                okfunc = function () {
                                    _.ui.showInput({
                                        title: _.language.get("符合追加产品组合条件的采购合同有:"),
                                        type: "dropdown",
                                        value: "", //默认值
                                        fields: aPurchaseOrderNoList,
                                        onapprove: function (sFPurchaseOrderNo) {
                                            if (!sFPurchaseOrderNo) {
                                                return;
                                            } else {
                                                try {
                                                    iSupplierAgentIndex = aPurchaseOrderNoList.indexOf(sFPurchaseOrderNo);
                                                    _.app.ui.createEditor({
                                                        moduleName: "采购合同",
                                                        rid: aPurchaseRecordIDlist[iSupplierAgentIndex],
                                                        onInit: function (oEditorForm) {
                                                            oTable = oEditorForm.recordSet.tableByName('产品资料');
                                                            var oData = oRow.data;
                                                            for (var i in oData) {
                                                                oTable.append();
                                                                oEditorForm.recordSet.fieldByName('产品资料.产品编号').val(oData[i].sItemNo);
                                                                oEditorForm.recordSet.fieldByName('产品资料.产品标识').val(oData[i].sRecordID);
                                                            }
                                                            oEditorForm.save(false, function (oRecord) {
                                                                if (oRecord) {
                                                                    setTimeout(function () {
                                                                        fnjudge();
                                                                    });
                                                                }
                                                            });
                                                        },
                                                        onError: function (oRecord) {
                                                            if (oRecord) {
                                                            }
                                                        },
                                                        async: true
                                                    });
                                                } catch (err) {
                                                    _.ui.showError(_.language.get('追加产品失败！'));
                                                }
                                            }
                                        }
                                    });
                                },
                                cancelfunc = function () {
                                    fnNewRcord(oRow);
                                }
                            );
                        } else {
                            fnNewRcord(oRow);
                        }
                    }

                    var fnjudge = function () {
                        if (aGroupRows.length > 0) {
                            fnNewOrAdd(aGroupRows.pop());
                        } else {
                            fnGetPurchaseOrderNo(function (res) {
                                if (res == true) {
                                    self.table("采购明细").setSelects([]);
                                    self.UIsave(false); //跳过保存校验
                                }
                            });
                        }
                    }

                    fnNewOrAdd(aGroupRows.pop()); //首次执行
                    //--------------------------------------------------------------分批新建或追加合同结束--------------------------------------------------------------
                    _.ui.closeWatting(); //关闭等待框
                });
            }
        };

        //---<采购计划_分解产品资料>
        var fnPurchasePlans_SpliteItems = function () {
            var fnSplitItem = function (sItemNo, sRoad, fComposeQty, bCopySelf) {
                if (!bCopySelf) {
                    self.recordSet.tableByName('采购明细').append();
                    self.recordSet.fieldByName('采购明细.对应产品').val(sRoad);
                    self.recordSet.fieldByName('采购明细.产品编号').val(self.recordSet.fieldByName('产品资料.产品编号').val());
                    self.recordSet.fieldByName('采购明细.产品条码').val(self.recordSet.fieldByName('产品资料.产品条码').val());
                    self.recordSet.fieldByName('采购明细.客户货号').val(self.recordSet.fieldByName('产品资料.客户货号').val());
                    self.recordSet.fieldByName('采购明细.中文品名').val(self.recordSet.fieldByName('产品资料.中文品名').val());
                    self.recordSet.fieldByName('采购明细.英文品名').val(self.recordSet.fieldByName('产品资料.英文品名').val());
                    self.recordSet.fieldByName('采购明细.中文规格').val(self.recordSet.fieldByName('产品资料.中文规格').val());
                    self.recordSet.fieldByName('采购明细.英文规格').val(self.recordSet.fieldByName('产品资料.英文规格').val());
                    self.recordSet.fieldByName('采购明细.专业描述1').val(self.recordSet.fieldByName('产品资料.专业描述1').val());
                    self.recordSet.fieldByName('采购明细.专业描述2').val(self.recordSet.fieldByName('产品资料.专业描述2').val());
                    self.recordSet.fieldByName('采购明细.专业描述3').val(self.recordSet.fieldByName('产品资料.专业描述3').val());
                    self.recordSet.fieldByName('采购明细.专业描述4').val(self.recordSet.fieldByName('产品资料.专业描述4').val());
                    self.recordSet.fieldByName('采购明细.专业描述5').val(self.recordSet.fieldByName('产品资料.专业描述5').val());
                    self.recordSet.fieldByName('采购明细.产品组成').val(self.recordSet.fieldByName('产品资料.产品组成').val());
                    self.recordSet.fieldByName('采购明细.计量单位').val(self.recordSet.fieldByName('产品资料.计量单位').val());
                    self.recordSet.fieldByName('采购明细.组成用量').val(fComposeQty);
                    self.recordSet.fieldByName('采购明细.交货日期').val(self.recordSet.fieldByName('产品资料.交货日期').val());
                    self.recordSet.fieldByName('采购明细.生产交期').val(_.date.incDay((new Date(self.recordSet.fieldByName('产品资料.交货日期').val())).Format("yyyy-MM-dd"), -7));
                    self.recordSet.fieldByName('采购明细.合同数量').val(self.recordSet.fieldByName('产品资料.合同数量').val());
                    self.recordSet.fieldByName('采购明细.采购单价').val(self.recordSet.fieldByName('产品资料.采购单价').val());
                    self.recordSet.fieldByName('采购明细.采购总价').val(self.recordSet.fieldByName('产品资料.采购总价').val());
                    self.recordSet.fieldByName('采购明细.厂商编号').val(self.recordSet.fieldByName('产品资料.厂商编号').val());
                    self.recordSet.fieldByName('采购明细.厂商简称').val(self.recordSet.fieldByName('产品资料.厂商简称').val());
                    self.recordSet.fieldByName('采购明细.工厂货号').val(self.recordSet.fieldByName('产品资料.工厂货号').val());

                    try {
                        var oSQL = _.db.execute('PurchasePlans_Select_Dic_Package', {
                            "values": {
                                "sENGName": self.recordSet.fieldByName('产品资料.包装方式').val()
                            }
                        });
                        if (oSQL.length > 0) {
                            self.recordSet.fieldByName('采购明细.包装方式').val(oSQL[0].CHNName);
                        }
                    } catch (err) {
                        _.log.error('查询包装方式出错！');
                    }
                    try {
                        var oSQL = _.db.execute('PurchasePlans_Select_Items_ItemsQuote', {
                            "values": {
                                "sItemNo": self.recordSet.fieldByName('产品资料.产品编号').val(),
                                "sSupplierNo": self.recordSet.fieldByName('产品资料.厂商编号').val()
                            }
                        });
                        if (oSQL.length > 0) {
                            self.recordSet.fieldByName('采购明细.分配采购员').val(oSQL[0].PurchasingAgent);
                        }
                    } catch (err) {
                        _.log.error('查询采购人员出错！');
                    }
                    self.recordSet.fieldByName('采购明细.采购币种').val(self.recordSet.fieldByName('产品资料.采购币种').val());
                    self.recordSet.fieldByName('采购明细.特殊要求').val(self.recordSet.fieldByName('产品资料.特殊要求').val());
                    self.recordSet.fieldByName('采购明细.是否开票').val(self.recordSet.fieldByName('产品资料.是否开票').val());
                    self.recordSet.fieldByName('采购明细.内盒装量').val(self.recordSet.fieldByName('产品资料.内盒装量').val());
                    self.recordSet.fieldByName('采购明细.外箱装量').val(self.recordSet.fieldByName('产品资料.外箱装量').val());
                    self.recordSet.fieldByName('采购明细.箱数').val(self.recordSet.fieldByName('产品资料.箱数').val());
                    self.recordSet.fieldByName('采购明细.外箱单位').val(self.recordSet.fieldByName('产品资料.外箱单位').val());
                    self.recordSet.fieldByName('采购明细.外箱长度').val(self.recordSet.fieldByName('产品资料.外箱长度').val());
                    self.recordSet.fieldByName('采购明细.外箱宽度').val(self.recordSet.fieldByName('产品资料.外箱宽度').val());
                    self.recordSet.fieldByName('采购明细.外箱高度').val(self.recordSet.fieldByName('产品资料.外箱高度').val());
                    self.recordSet.fieldByName('采购明细.外箱毛重').val(self.recordSet.fieldByName('产品资料.外箱毛重').val());
                    self.recordSet.fieldByName('采购明细.外箱净重').val(self.recordSet.fieldByName('产品资料.外箱净重').val());
                    self.recordSet.fieldByName('采购明细.专业描述6').val(self.recordSet.fieldByName('产品资料.专业描述6').val());
                    self.recordSet.fieldByName('采购明细.专业描述7').val(self.recordSet.fieldByName('产品资料.专业描述7').val());
                    self.recordSet.fieldByName('采购明细.中文说明').val(self.recordSet.fieldByName('产品资料.中文说明').val());
                    self.recordSet.fieldByName('采购明细.产品正唛').val(self.recordSet.fieldByName('产品资料.产品正唛').val());
                    self.recordSet.fieldByName('采购明细.产品侧唛').val(self.recordSet.fieldByName('产品资料.产品侧唛').val());
                    self.recordSet.fieldByName('采购明细.产品标识').val(self.recordSet.fieldByName('产品资料.产品标识').val());
                    return false;
                } else {
                    var oSQL = _.db.execute('PurchasePlans_Select_Items_ItemsConstruction', {
                        "values": {
                            "sItemNo": sItemNo
                        }
                    });
                    if (oSQL.length > 0) {
                        for (var i in oSQL) {
                            if (oSQL[i].ItemConstruction == '配件' || oSQL[i].ItemConstruction == '成品') {
                                self.recordSet.tableByName('采购明细').append();
                                self.recordSet.fieldByName('采购明细.对应产品').val(sRoad);
                                self.recordSet.fieldByName('采购明细.产品编号').val(oSQL[i].ItemNo);
                                self.recordSet.fieldByName('采购明细.客户货号').val(self.recordSet.fieldByName('产品资料.客户货号').val());
                                self.recordSet.fieldByName('采购明细.交货日期').val(self.recordSet.fieldByName('产品资料.交货日期').val());
                                self.recordSet.fieldByName('采购明细.生产交期').val(_.date.incDay((new Date(self.recordSet.fieldByName('产品资料.交货日期').val())).Format("yyyy-MM-dd"), -7));
                                if (oSQL[i].CHNMemo) {
                                    self.recordSet.fieldByName('采购明细.中文说明').val(oSQL[i].CHNMemo);
                                } else {
                                    self.recordSet.fieldByName('采购明细.中文说明').val(self.recordSet.fieldByName('产品资料.中文说明').val());
                                }
                                if (oSQL[i].CHNSpecification) {
                                    self.recordSet.fieldByName('采购明细.中文规格').val(oSQL[i].CHNSpecification);
                                } else {
                                    self.recordSet.fieldByName('采购明细.中文规格').val(self.recordSet.fieldByName('产品资料.中文规格').val());
                                }
                                if (oSQL[i].CHNItemName) {
                                    self.recordSet.fieldByName('采购明细.中文品名').val(oSQL[i].CHNItemName);
                                } else {
                                    self.recordSet.fieldByName('采购明细.中文品名').val(self.recordSet.fieldByName('产品资料.中文品名').val());
                                }
                                if (oSQL[i].ENGSpecification) {
                                    self.recordSet.fieldByName('采购明细.英文规格').val(oSQL[i].ENGSpecification);
                                } else {
                                    self.recordSet.fieldByName('采购明细.英文规格').val(self.recordSet.fieldByName('产品资料.英文规格').val());
                                }
                                if (oSQL[i].ENGItemName) {
                                    self.recordSet.fieldByName('采购明细.英文品名').val(oSQL[i].ENGItemName);
                                } else {
                                    self.recordSet.fieldByName('采购明细.英文品名').val(self.recordSet.fieldByName('产品资料.英文品名').val());
                                }
                                if (oSQL[i].Barcode) {
                                    self.recordSet.fieldByName('采购明细.产品条码').val(oSQL[i].Barcode);
                                } else {
                                    self.recordSet.fieldByName('采购明细.产品条码').val(self.recordSet.fieldByName('产品资料.产品条码').val());
                                }
                                if (oSQL[i].SupplierNo) {
                                    self.recordSet.fieldByName('采购明细.厂商编号').val(oSQL[i].SupplierNo);
                                    self.recordSet.fieldByName('采购明细.厂商简称').val(oSQL[i].SupplierShortName);
                                    self.recordSet.fieldByName('采购明细.采购币种').val(oSQL[i].PurchaseCurrency);
                                    var oSQL2 = _.db.execute('PurchasePlans_Select_Items_ItemsQuote2', {
                                        "values": {
                                            "sItemNo": oSQL[i].ItemNo ? oSQL[i].ItemNo : '',
                                            "sSupplierNo": oSQL[i].SupplierNo ? oSQL[i].SupplierNo : ''
                                        }
                                    });
                                    if (oSQL2.length > 0) {
                                        self.recordSet.fieldByName('采购明细.工厂货号').val(oSQL2[0].SupplierNo);
                                        var oSQL3 = _.db.execute('PurchasePlans_Select_Dic_Package', {
                                            "values": {
                                                "sENGName": oSQL2[0].Packing ? oSQL2[0].Packing : ''
                                            }
                                        });
                                        if (oSQL3.length > 0) {
                                            self.recordSet.fieldByName('采购明细.包装方式').val(oSQL3[0].SupplierNo);
                                        }
                                        self.recordSet.fieldByName('采购明细.分配采购员').val(oSQL2[0].PurchasingAgent);
                                        self.recordSet.fieldByName('采购明细.是否开票').val(oSQL2[0].CanBill);
                                        self.recordSet.fieldByName('采购明细.内盒装量').val(oSQL2[0].InnerCapacity);
                                        self.recordSet.fieldByName('采购明细.外箱装量').val(oSQL2[0].OuterCapacity);
                                        self.recordSet.fieldByName('采购明细.外箱单位').val(oSQL2[0].CartonUnit);
                                        self.recordSet.fieldByName('采购明细.外箱长度').val(oSQL2[0].OuterLength);
                                        self.recordSet.fieldByName('采购明细.外箱宽度').val(oSQL2[0].OuterWidth);
                                        self.recordSet.fieldByName('采购明细.外箱高度').val(oSQL2[0].OuterHeight);
                                        self.recordSet.fieldByName('采购明细.外箱毛重').val(oSQL2[0].OuterGrossWeight);
                                        self.recordSet.fieldByName('采购明细.外箱净重').val(oSQL2[0].OuterNetWeight);
                                    }
                                }

                                self.recordSet.fieldByName('采购明细.采购单价').val(oSQL[i].PurchasePrice);
                                self.recordSet.fieldByName('采购明细.计量单位').val(oSQL[i].Unit);
                                self.recordSet.fieldByName('采购明细.产品组成').val(oSQL[i].ItemConstruction);
                                self.recordSet.fieldByName('采购明细.组成用量').val(fComposeQty * oSQL[i].ComposeQty);
                                self.recordSet.fieldByName('采购明细.合同数量').val(self.recordSet.fieldByName('产品资料.合同数量').val() * fComposeQty * oSQL[i].ComposeQty);
                                self.recordSet.fieldByName('采购明细.专业描述1').val(oSQL[i].UserDefaultField1);
                                self.recordSet.fieldByName('采购明细.专业描述2').val(oSQL[i].UserDefaultField2);
                                self.recordSet.fieldByName('采购明细.专业描述3').val(oSQL[i].UserDefaultField3);
                                self.recordSet.fieldByName('采购明细.专业描述4').val(oSQL[i].UserDefaultField4);
                                self.recordSet.fieldByName('采购明细.专业描述5').val(oSQL[i].UserDefaultField5);
                                self.recordSet.fieldByName('采购明细.专业描述6').val(oSQL[i].UserDefaultField6);
                                self.recordSet.fieldByName('采购明细.专业描述7').val(oSQL[i].UserDefaultField7);
                                self.recordSet.fieldByName('采购明细.产品标识').val(self.recordSet.fieldByName('产品资料.产品标识').val());
                            } else {
                                fnSplitItem(oSQL[i].ItemNo, sRoad + '\\' + oSQL[i].ItemNo, fComposeQty * oSQL[i].ComposeQty, true);
                            }

                        }
                    }
                    return true;
                }
            };
            var aPurchaseItemList = [];
            var aAddItemList = [];
            var isResult;
            var aItemNo = [];
            var aItemConstruction = [];
            var aCanSplited = [];

            //---循环[采购明细]的产品标识以便和[产品资料]的产品标识对比，判断是否为追加操作
            _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>' + _.language.get('正在操作') + '！', function () {
                var oSQL = _.db.execute('PurchasePlans_Select_PurchasePlans_PurchasePlansDelivery5', {
                    "values": {
                        "srid": self.rid
                    }
                });
                if (oSQL.length == 0) {
                    var oTable = self.recordSet.tableByName('产品资料');
                    self.recordSet.tableByName('采购明细').clear();
                    oTable.disableControl();
                    var iBookMark = oTable.cursor();
                    oTable.cursor(0, false);
                    try {
                        oTable.down(function () {
                            aItemNo.push(self.recordSet.fieldByName('产品资料.产品编号').val());
                            aItemConstruction.push(self.recordSet.fieldByName('产品资料.产品组成').val());
                            aCanSplited.push(self.recordSet.fieldByName('产品资料.是否分解').val());
                        });
                    } finally {
                        oTable.cursor(iBookMark, true);
                        oTable.enableControl('Batch_PurchasePlans2');
                    }
                    _.utils.processQueue(aItemNo, function (idx, element) {
                        oTable.cursor(idx - 1); //游标指向
                        fnSplitItem(element, element,
                            1, (aItemConstruction[idx - 1] == '组成' && aCanSplited[idx - 1]));
                        _.ui.Message({
                            msg: _.language.get('正在分解:') + `${idx}/${aItemNo.length} [${element}]`,
                            center: "center", //居中
                            autoClose: true, //是否自动关闭
                            showClose: false, //是否显示关闭按钮
                            type: 1, //info: 1, success: 2, warning: 3, error: 4
                            closeTime: 500 //自动关闭时间
                        });
                    }, function () {
                        _.ui.closeWatting(); //关闭等待框
                        _.ui.Message({
                            msg: _.language.get("分解成功！"),
                            center: "center", //居中
                            autoClose: true, //是否自动关闭
                            showClose: false, //是否显示关闭按钮
                            type: 2, //info: 1, success: 2, warning: 3, error: 4
                            closeTime: 5000 //自动关闭时间
                        });
                    });
                } else {
                    for (var i = 0; i < oSQL.length; i++) {
                        aPurchaseItemList.push(oSQL[i].SOL_RecordID);
                    }
                    //---循环产品资料，将不在[采购明细]的产品标识作为追加项
                    var oSQL = _.db.execute('PurchasePlans_Select_PurchasePlans_PurchasePlansDelivery6', {
                        "values": {
                            "srid": self.recordSet.fieldByName('rid').val()
                        }
                    });
                    if (oSQL.length == 0) {
                        _.ui.showWarnning(_.language.get('[产品资料]没有发现数据，操作中止！'));
                        return;
                    } else {
                        var oTable = self.recordSet.tableByName('产品资料');
                        for (var i in oSQL) {
                            if (aPurchaseItemList.indexOf(oSQL[i].SOL_RecordID) < 0) {
                                aAddItemList.push(oSQL[i].SOL_RecordID);
                            }
                        }
                        var iBookMark = oTable.cursor();
                        for (var i in aAddItemList) {
                            oTable.locate('产品资料.SOL_RecordID', aAddItemList[i], true, true, function (iIdx) {
                                oTable.cursor(iIdx, false);
                            }); //子表快速定位
                            fnSplitItem(self.recordSet.fieldByName('产品资料.产品编号').val(), self.recordSet.fieldByName('产品资料.产品编号').val(),
                                1, (self.recordSet.fieldByName('产品资料.产品组成').val() == '组成' && self.recordSet.fieldByName('产品资料.是否分解').val()));
                        }
                        oTable.cursor(iBookMark, true);
                    }
                    _.ui.closeWatting(); //关闭等待框
                }
            });
        };

        //---<采购计划_批量勾选>
        var fnMultiChecked = function (sModule, sFullFileName, bCheck) {
            var aSelected = self.table(sModule).getSelects();
            var oTable = self.recordSet.tableByName(sModule);
            var iBookMark = oTable.cursor();
            for (var i in aSelected) {
                oTable.cursor(aSelected[i], false);
                self.recordSet.fieldByName(sFullFileName).val(bCheck);
            }
            oTable.cursor(iBookMark, true);
        }

        //---<采购计划_批量选择采购员>
        var fnMultiSelectPurchaser = function () {
            var aUserName = [];
            var aSelected = self.table('采购明细').getSelects();
            var oTable = self.recordSet.tableByName('采购明细');
            var oSQL = _.db.execute('PurchasePlans_Select_Username', {});
            for (var i in oSQL) {
                aUserName.push(oSQL[i].UserName);
            }
            var isError = 0;
            _.ui.showInput({
                title: _.language.get("请选择采购员："),
                type: "dropdown",
                value: "", //默认值
                fields: aUserName,
                onapprove: function (val) {
                    if (val) {
                        var iBookMark = oTable.cursor();
                        for (var i in aSelected) {
                            oTable.cursor(aSelected[i], false);
                            self.recordSet.fieldByName('采购明细.分配采购员').val(val);
                        }
                        oTable.cursor(iBookMark, true);
                    } else {
                        isError = 1;
                    }
                },
                onHide: function () {
                    if (isError == 1) {
                        _.ui.showError(_.language.get('选择结果错误！'));
                    }
                }
            });
        }

        //---<采购计划_批量选择工厂>
        var fnMultiSelectSuppliers = function () {
            var aSuppliers = [];
            var aSelected = self.table('采购明细').getSelects();
            var oTable = self.recordSet.tableByName('采购明细');
            var oSQL = _.db.execute('PurchasePlans_Select_Suppliers', {});
            for (var i in oSQL) {
                aSuppliers.push(oSQL[i].SupplierNo);
            }
            var isError = 0;
            _.ui.showInput({
                title: "请选择厂商编号：",
                type: "dropdown",
                value: "", //默认值
                fields: aSuppliers,
                onapprove: function (val) {
                    if (val) {
                        var iBookMark = oTable.cursor();
                        for (var i in aSelected) {
                            oTable.cursor(aSelected[i], false);
                            self.recordSet.fieldByName('采购明细.厂商编号').val(val);
                        }
                        oTable.cursor(iBookMark, true);
                    } else {
                        _.ui.showError('选择结果错误！');
                        isError = 1;
                    }
                },
                onHide: function () {
                    if (isError == 1) {
                        _.ui.showError('选择结果错误！');
                    }
                }
            });
        }

        //---<采购计划_新建工厂资料>
        var fnPurchasePlans_NewCustomer = function () {
            var sSupplierShortName = self.recordSet.fieldByName('采购明细.厂商简称').val();
            var oSQL = _.db.execute('Items_Select_SupplierShortName', {
                "values": {
                    "sSupplierShortName": sSupplierShortName
                }
            });
            if (oSQL.length > 0) {
                _.ui.showWarnning('[' + oSQL[0].sModule + ']/' + oSQL[0].SupplierNo + '：' + _.language.get('该客商已建档！'));
            } else {
                _.app.ui.createEditor({
                    moduleName: "工厂资料",
                    onInit: function (oEditor) {
                        oEditor.recordSet.fieldByName('厂商编号').val(self.recordSet.fieldByName('采购明细.厂商编号').val());
                        oEditor.recordSet.fieldByName('厂商简称').val(sSupplierShortName);
                        oEditor.save(false, function (oRecord) {
                            if (oRecord) {
                                if (self.recordSet.fieldByName('采购明细.厂商编号').val() != oRecord.recordSet.fieldByName('厂商编号').val()) {
                                    self.recordSet.fieldByName('采购明细.厂商编号').val(oRecord.recordSet.fieldByName('厂商编号').val());
                                }

                                _.ui.yesOrNo(
                                    _.language.get('[工厂资料]新建成功，是否进一步完善其他信息？'),
                                    okfunc = function () {
                                        _.app.ui.openEditor('edit', '工厂资料', oRecord.recordSet.fieldByName('rid').val()); //可以打开记录
                                    },
                                    cancelfunc = function () {

                                    }
                                );
                            }
                        });
                    },
                    onError: function (oRecord) {
                        if (oRecord) {
                            _.log.error('保存失败！');
                        }
                    },
                    async: true
                });
            }
        };

        if (self.addButton) {
            self.addButton("bExtend", _.language.get("扩展"), "", "yelp", true, true); //下拉菜单
            self.button('bExtend').addButton("bPurchasePlans_AutoPurchaseOrder", _.language.get("一次性下单生成采购合同"), function () {
                fnPurchasePlans_AutoPurchaseOrder();
            });
            if (obj.evtID == EVT_EDITFORM_CREATED) {
                self.button('bExtend').addButton("bPurchasePlans_PartialPurchaseOrder", _.language.get("分批次下单生成采购合同"), function () {
                    fnPurchasePlans_PartialPurchaseOrder();
                });

                self.area('产品资料').addButton("bSheetItemsExtend", _.language.get("扩展"), "", "yelp", true); //下拉菜单 
                self.area('产品资料').button('bSheetItemsExtend').addButton("bPurchasePlansSpliteItems", _.language.get("分解产品资料"), function () {
                    if (self.modified) {
                        _.ui.showWarnning(_.language.get("记录未保存，系统停止操作！"));
                        return;
                    }
                    fnPurchasePlans_SpliteItems();
                });

                self.area('产品资料').button('bSheetItemsExtend').addButton("bMultiChecked", _.language.get("批量勾选分解"), function () {
                    fnMultiChecked('产品资料', '产品资料.是否分解', true);
                });

                self.area('产品资料').button('bSheetItemsExtend').addButton("bMultiNotChecked", _.language.get("批量去勾选分解"), function () {
                    fnMultiChecked('产品资料', '产品资料.是否分解', false);
                });

                self.area('采购明细').addButton("bSheetDeliveryExtend", _.language.get("扩展"), "", "yelp", true); //下拉菜单 
                self.area('采购明细').button('bSheetDeliveryExtend').addButton("bMultiSelectPurchaser", _.language.get("批量选择采购员"), function () {
                    fnMultiSelectPurchaser();
                });

                self.area('采购明细').button('bSheetDeliveryExtend').addButton("bPurchasePlans_MultiSelectSuppliers", _.language.get("批量选择采购工厂"), function () {
                    fnMultiSelectSuppliers();
                });

                self.area('采购明细').button('bSheetDeliveryExtend').addButton("bPurchasePlansNewItems", _.language.get("新建工厂资料"), function () {
                    fnPurchasePlans_NewCustomer();
                });
            }
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY, EVT_SEARCHFORM_CREATED], btn_PurchasePlans);

function evt_onShow_PurchasePlans(obj) {
    var self = obj.form;
    if (self.moduleName == '采购计划') {
        fnPurchasePlans_PurchaseOrderNo(self);
    }
}
addListener([EVT_EDITFORM_CREATED], evt_onShow_PurchasePlans);


//---<采购计划_AfterSave>
function evt_PurchasePlans_Aftersave(obj) {
    var self = obj.form;
    if (self.moduleName == '采购计划') {
        fnPurchasePlans_PurchaseOrderNo(self);
    }
}
addListener([EVT_RECORDSET_AFTER_SAVE], evt_PurchasePlans_Aftersave);