function btn_SendSamples(obj) {
    var self = obj.form;
    if (self.moduleName == '寄样管理') {
        //---<寄样管理_新建产品推荐>
        var fnSendSamples_Recommend = function () {
            try {
                var sModuleName = '产品推荐';
                var oModulePermission = _.app.permission.getModulePermission(sModuleName);
                if (!oModulePermission.new) {
                    _.ui.showWarnning(sModuleName + _.language.get('您没有新建该模块的权限！'));
                    return;
                }
                var aItems = [];
                var oTable = self.recordSet.tableByName('产品资料');
                oTable.disableControl();
                var iBookMark = oTable.cursor();
                oTable.cursor(0, false);
                try {
                    oTable.down(function () {
                        aItems.push(self.recordSet.fieldByName('产品资料.产品编号').val());
                    });
                } finally {
                    oTable.cursor(iBookMark, true);
                    oTable.enableControl('Batch_SendSamples');
                }
                _.app.ui.openEditor('new', '产品推荐', '', function (oEditor) {
                    _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i><span class="text"></span>', function (el) {
                        var oTable = oEditor.recordSet.tableByName('产品资料');
                        oTable.disableControl();
                        el.css("width", "220px!important");
                        el.css("line-height", "20px");
                        _.utils.processQueue(aItems, function (idx, element) {
                            oTable.append();
                            oEditor.recordSet.fieldByName('产品资料.产品编号').val(element);
                            el.find(".text").html(_.language.get("正在操作") + '！<br/>(' + _.language.get("第") + idx + _.language.get("条") + '，' + _.language.get("共") + aItems.length + _.language.get("条") + '！)');
                        }, function () {
                            oTable.enableControl('Batch_SendSamples2');
                            _.ui.closeWatting();
                        });
                    });
                });
            } catch (err) {
                _.log.error('新建产品推荐发生错误！');
            }
        };

        //---<寄样管理_新建客户资料>
        var fnSendSamples_NewCustomer = function () {
            var sDirecte = self.recordSet.fieldByName('寄样对象').val();
            if (sDirecte.length == 0) {
                return;
            }
            var smoduleName, sShortName, sNo;
            var sCustomerShortName = self.recordSet.fieldByName('伙伴简称').val();
            if (sDirecte == '客户') {
                var oSQL = _.db.execute('Quotations_Select_CustomerShortName', {
                    "values": {
                        "sCustomerShortName": sCustomerShortName
                    }
                });
                smoduleName = '客户资料';
                sShortName = '客户简称';
                sNo = '客户编号';
            } else if (sDirecte == '工厂') {
                var oSQL = _.db.execute('SendSamples_Select_SupplierShortName', {
                    "values": {
                        "sSupplierShortName": sCustomerShortName
                    }
                });
                smoduleName = '工厂资料';
                sShortName = '厂商简称';
                sNo = '厂商编号';
            }

            if (oSQL.length > 0) {
                _.ui.showWarnning('[' + oSQL[0].sModule + ']/' + oSQL[0].CustomerNo + ':' + _.language.get('该客商已建档！'));
            } else {
                _.app.ui.createEditor({
                    moduleName: smoduleName,
                    onInit: function (oEditor) {
                        oEditor.recordSet.fieldByName(sNo).val(self.recordSet.fieldByName('伙伴编号').val());
                        oEditor.recordSet.fieldByName(sShortName).val(sCustomerShortName);
                        oEditor.save(false, function (oRecord) {
                            if (oRecord) {
                                if (self.recordSet.fieldByName('伙伴编号').val() != oRecord.recordSet.fieldByName(sNo).val()) {
                                    self.recordSet.fieldByName('伙伴编号').val(oRecord.recordSet.fieldByName(sNo).val());
                                }

                                _.ui.yesOrNo(
                                    '[' + smoduleName + ']' + _.language.get('新建成功，是否进一步完善其他信息？'),
                                    okfunc = function () {
                                        _.app.ui.openEditor('edit', smoduleName, oRecord.recordSet.fieldByName('rid').val()); //可以打开记录
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

        //---<寄样管理_新建产品资料>
        var fnSendSamples_NewItems = function () {
            _.app.ui.createEditor({
                moduleName: "产品资料",
                onInit: function (oEditor) {
                    oEditor.recordSet.fieldByName('英文规格').val(self.recordSet.fieldByName('产品资料.英文规格').val());
                    oEditor.recordSet.fieldByName('中文规格').val(self.recordSet.fieldByName('产品资料.中文规格').val());
                    oEditor.recordSet.fieldByName('中文品名').val(self.recordSet.fieldByName('产品资料.中文品名').val());
                    oEditor.recordSet.fieldByName('英文品名').val(self.recordSet.fieldByName('产品资料.英文品名').val());
                    oEditor.recordSet.fieldByName('专业描述1').val(self.recordSet.fieldByName('产品资料.专业描述1').val());
                    oEditor.recordSet.fieldByName('专业描述2').val(self.recordSet.fieldByName('产品资料.专业描述2').val());
                    oEditor.recordSet.fieldByName('专业描述3').val(self.recordSet.fieldByName('产品资料.专业描述3').val());
                    oEditor.recordSet.fieldByName('专业描述4').val(self.recordSet.fieldByName('产品资料.专业描述4').val());
                    oEditor.recordSet.fieldByName('专业描述5').val(self.recordSet.fieldByName('产品资料.专业描述5').val());
                    oEditor.recordSet.fieldByName('计量单位').val(self.recordSet.fieldByName('产品资料.计量单位').val());
                    oEditor.recordSet.fieldByName('采购单价').val(self.recordSet.fieldByName('产品资料.采购单价').val());
                    oEditor.recordSet.fieldByName('专业描述6').val(self.recordSet.fieldByName('产品资料.专业描述6').val());
                    oEditor.recordSet.fieldByName('专业描述7').val(self.recordSet.fieldByName('产品资料.专业描述7').val());
                    oEditor.recordSet.fieldByName('销售单价').val(self.recordSet.fieldByName('产品资料.销售单价').val());

                    if (self.recordSet.fieldByName('产品资料.厂商简称').val().length > 0) {
                        oEditor.recordSet.tableByName('工厂报价').append();
                        oEditor.recordSet.fieldByName('工厂报价.厂商编号').val(self.recordSet.fieldByName('产品资料.厂商编号').val());
                        oEditor.recordSet.fieldByName('工厂报价.厂商简称').val(self.recordSet.fieldByName('产品资料.厂商简称').val());
                        oEditor.recordSet.fieldByName('工厂报价.工厂货号').val(self.recordSet.fieldByName('产品资料.工厂货号').val());
                    }
                    oEditor.save(false, function (oRecord) {
                        if (oRecord) {
                            self.recordSet.fieldByName('产品资料.产品编号').val(oRecord.recordSet.fieldByName('产品编号').val());
                            _.ui.yesOrNo(
                                _.language.get('[产品资料]新建成功，是否进一步完善其他信息？'),
                                okfunc = function () {
                                    _.app.ui.openEditor('edit', '产品资料', oRecord.recordSet.fieldByName('rid').val()); //可以打开记录
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
        };

        if (self.addButton) {
            self.addButton("bExtend", _.language.get("扩展"), "", "yelp", true, true); //下拉菜单
            self.button('bExtend').addButton("bSendSamplesCreateRecommend", _.language.get('给客户推荐产品'), function () {
                fnSendSamples_Recommend();
            }, 'tags icon');
            self.button('bExtend').addButton("bSendSamplesCustomers", _.language.get("新建客户资料"), function () {
                fnSendSamples_NewCustomer();
            });

            self.area('产品资料').addButton("bSheetExtend", _.language.get("扩展"), "", "yelp", true, true);
            self.area('产品资料').button('bSheetExtend').addButton("bSendSamplesNewItems", _.language.get("新建产品资料"), function () {
                fnSendSamples_NewItems();
            });
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], btn_SendSamples);

//---<寄样管理_显示快件费>
var fnPaymentMethod = function (self) {
    if (self.recordSet.fieldByName('付费方式').val() == '预付') {
        self.area('快件费用').show();
    } else {
        self.area('快件费用').hide();
    }
};

//---<寄样管理_显示供应商>
var fnDirecte = function (self) {
    if (self.recordSet.fieldByName('寄样对象').val() == '客户') {
        self.field("产品资料.厂商编号").show();
        self.field("产品资料.厂商简称").show();
        self.field("产品资料.工厂货号").show();
    } else {
        self.field("产品资料.厂商编号").hide();
        self.field("产品资料.厂商简称").hide();
        self.field("产品资料.工厂货号").hide();
    }
};

function evt_SendSamples_Show(obj) {
    var self = obj.form;
    if (self.moduleName == '寄样管理') {
        fnPaymentMethod(self);
        fnDirecte(self);
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], evt_SendSamples_Show);

function cge_EditForm_SendSamples(obj) {
    var self = obj.form;
    var cgeField = obj.field;
    if (self.moduleName == '寄样管理') {
        if (cgeField.fullName == '寄样管理.付费方式') {
            fnPaymentMethod(self);
        }
        if (cgeField.fullName == '寄样管理.寄样对象') {
            fnDirecte(self);
        }
    }
}
addListener([EVT_RECORDSET_AFTER_FIELD_CHANGED], cge_EditForm_SendSamples);

//---<寄样管理_记录复制>
function evt_SendSamples_aftercopy(obj) {
    var self = obj.form;
    if (self.moduleName == "寄样管理") {
        self.recordSet.fieldByName('已付快件费').val(0);
        self.recordSet.fieldByName('已申请付款').val(0);
        self.recordSet.fieldByName('已收样品费').val(0);
    }
}
addListener([EVT_RECORDSET_AFTER_COPY], evt_SendSamples_aftercopy);