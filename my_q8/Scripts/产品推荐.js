function btn_Recommendation(obj) {
    var self = obj.form;
    if (self.moduleName == '产品推荐') {
        //---<产品推荐_给客户报价>
        var fnRecommendation_QuoteToCustomer = function () {
            try {
                var aLstRecords = self.recordSet.fieldByName('产品资料.产品编号').getColValue();
                if (self.type == 'edit') {
                    _.app.ui.openEditor('new', '客户报价', '', function (oEditor) {
                        _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i><span class="text"></span>', function (el) {
                            var oTable = oEditor.recordSet.tableByName('产品资料');
                            oTable.disableControl();
                            el.css("width", "220px!important");
                            el.css("line-height", "20px");
                            _.utils.processQueue(aLstRecords, function (idx, element) {
                                oTable.append();
                                oEditor.recordSet.fieldByName('产品资料.产品编号').val(element);
                                el.find(".text").html(_.language.get("正在操作") + '！<br/>(' + _.language.get("第") + idx + _.language.get("条") + '，' + _.language.get("共") + aLstRecords.length + _.language.get("条") + '！)');
                            }, function () {
                                oTable.enableControl('Batch_Recommendation2');
                                _.ui.closeWatting();
                            });
                        });
                    });
                }
            } catch (err) {
                _.log.error('给客户报价发生错误！');
            }
        };
        if (self.addButton) {
            self.addButton("bExtend", _.language.get("扩展"), "", "yelp", true); //下拉菜单
            self.button('bExtend').addButton("RecommendationQuoteToCustomer", _.language.get("给客户报价"), function () {
                fnRecommendation_QuoteToCustomer();
            });
        }
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], btn_Recommendation);