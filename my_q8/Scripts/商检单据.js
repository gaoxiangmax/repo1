//---<商检单据_自动生成报关单据>
var fnInspections_AutoDeclarations = function (self) {
    var sTargetMouleName = '报关单据';
    var oModulePermission = _.app.permission.getModulePermission(sTargetMouleName);
    if (!oModulePermission.new) {
        _.ui.showWarnning(_.language.get('您没有新建该模块的权限！'));
        return;
    }

    if (self.modified) {
        _.ui.showWarnning(_.language.get('记录未保存，系统停止操作！'));
        return;
    }

    var sInvoiceNO, sInspectionsInvoiceNO, sSupplierNo, sSupplierShortName;
    var srid;
    if (self.type == 'search') {
        srid = self.rid;
    } else {
        srid = self.recordSet.fieldByName('rid').val();
    }
    var oSQL = _.db.execute('Inspections_Select_Inspections', {
        "values": {
            "srid": srid
        }
    });
    if (oSQL.length > 0) {
        sInvoiceNO = oSQL[0].InvoiceNO;
        sInspectionsInvoiceNO = oSQL[0].InspectionsInvoiceNO;
        sSupplierNo = oSQL[0].SupplierNo;
        sSupplierShortName = oSQL[0].SupplierShortName;
    }
    var oSQL = _.db.execute('Inspections_Select_Declarations', {
        "values": {
            "sCustomsInvoiceNO": sInspectionsInvoiceNO
        }
    });
    if (oSQL.length > 0) {
        _.ui.yesOrNo(
            _.language.get('系统检测报关单据已生成，是否删除，重新生成！'),
            okfunc = function () {
                try {
                    _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i' + _.language.get('正在操作') + '!', function () {
                        _.app.db.deleteModuleRecord('报关单据', oSQL[0].rid);

                        _.app.ui.createEditor({
                            moduleName: "报关单据",
                            onInit: function (oEditorForm) {
                                oEditorForm.recordSet.fieldByName('发票号码').val(sInvoiceNO);
                                oEditorForm.recordSet.fieldByName('报关发票号码').val(sInspectionsInvoiceNO);
                                oEditorForm.recordSet.fieldByName('数据来源').val('商检单据');
                                oEditorForm.recordSet.fieldByName('厂商编号').val(sSupplierNo);
                                oEditorForm.recordSet.fieldByName('厂商简称').val(sSupplierShortName);
                                oEditorForm.save(false, function (oRecord) {
                                    if (oRecord) {
                                        _.app.ui.openEditor('edit', '报关单据', oRecord.recordSet.fieldByName('rid').val()); //可以打开记录
                                        _.log.dev('保存成功！');
                                    }
                                });
                            },
                            onError: function (err) {
                                if (err) {
                                    _.log.error('保存失败！');
                                }
                            },
                            async: true
                        });
                        _.ui.closeWatting();
                    });
                } catch (err) {
                    _.ui.closeWatting();
                    _.log.error('系统异常，删除报关单据失败！');
                }
            },
            cancelfunc = function () {
                _.ui.showWarnning(_.language.get('报关单据已生成，系统中止操作！'));
                isCancel = true;
            }
        );
    } else {
        _.app.ui.createEditor({
            moduleName: "报关单据",
            onInit: function (oEditorForm) {
                oEditorForm.recordSet.fieldByName('发票号码').val(sInvoiceNO);
                oEditorForm.recordSet.fieldByName('报关发票号码').val(sInspectionsInvoiceNO);
                oEditorForm.recordSet.fieldByName('数据来源').val('商检单据');
                oEditorForm.recordSet.fieldByName('厂商编号').val(sSupplierNo);
                oEditorForm.recordSet.fieldByName('厂商简称').val(sSupplierShortName);
                // oEditorForm.recordSet.doDataFill('商检产品资料_自动动作');
                // oEditorForm.recordSet.doDataFill('出运明细非商检_自动动作');
                // oEditorForm.recordSet.doDataFill('出运明细采购明细_自动动作');
                // oEditorForm.recordSet.doDataFill('事_海关编码_出运明细');
                oEditorForm.save(false, function (oRecord) {
                    if (oRecord) {
                        _.app.ui.openEditor('edit', '报关单据', oRecord.recordSet.fieldByName('rid').val()); //可以打开记录
                        _.log.dev('保存成功！');
                    }
                });
            },
            onError: function (err) {
                if (err) {
                    _.log.error('保存失败！');
                }
            },
            async: true
        });
    }
};

function btn_Inspections(obj) {
    var self = obj.form;
    if (self.moduleName == '商检单据') {
        if (self.addButton) {
            self.addButton("bExtend", _.language.get("扩展"), "", "yelp", true);
            self.button('bExtend').addButton("bInspections_AutoDeclarations", _.language.get("自动生成报关单据"), function () {
                fnInspections_AutoDeclarations(self);
            });
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY, EVT_SEARCHFORM_CREATED], btn_Inspections);