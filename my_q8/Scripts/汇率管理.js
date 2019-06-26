function btn_Exchangerate(obj) {
    var self = obj.form;
    if (self.moduleName == '汇率管理') {
        var fnExchangerate_DownExchange = function () {
            try {
                _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>'+ _.language.get('正在操作') + '!', function () {
                    _.net.get('/intersky/exchangerate', {}, function (oData) {
                        if (oData.data.reason === 'SUCCESSED!') {
                            var oRate = oData.data.result[0];
                            var oTable = self.recordSet.tableByName('详细信息');
                            oTable.clear();
                            for (var i in oRate) {
                                oTable.append();
                                var sCNY = oRate[i].name;
                                var fBuyPri = oRate[i].fBuyPri/100;
                                self.recordSet.fieldByName('详细信息.货币名称').val(sCNY);
                                self.recordSet.fieldByName('详细信息.汇率').val(fBuyPri);
                                self.recordSet.fieldByName('详细信息.发布时间').val(oRate[i].date + ' ' + oRate[i].time);
                                var oSQL = _.db.execute('Exchangerate_Select_CNY', {
                                    "values": {
                                        "sCNY": sCNY
                                    }
                                });
                                if (oSQL.length > 0) {
                                    if (oSQL[0].Rate - fBuyPri != 0) {
                                        _.db.execute('Exchangerate_Update_Dic_Currency', {
                                            "values": {
                                                "sCNY": sCNY,
                                                "fRate": fBuyPri
                                            }
                                        });
                                    }
                                }

                            }
                            _.ui.closeWatting(); //关闭等待框
                        }
                    });
                });
            } catch (err) {
                _.ui.showError(_.language.get('操作失败！'));
                _.ui.closeWatting(); //关闭等待框
            }
        };


        var fnExchangerate_UpdateExchange = function () {
            try {
                _.ui.showWatting('<i class="spinner loading icon" style="color:#97CBFF;font-size:34px;"></i>'+ _.language.get('正在操作') + '!', function () {
                    _.net.get('/intersky/exchangerate', {}, function (oData) {
                        if (oData.data.reason === 'SUCCESSED!') {
                            var oRate = oData.data.result[0];
                            var oTable = self.recordSet.tableByName('详细信息');
                            var iBookMark=oTable.cursor();
                            for (var i in oRate) {
                                var sCNY = oRate[i].name;
                                var fBuyPri = oRate[i].fBuyPri/100;
                                oTable.locate('详细信息.货币名称', sCNY, true, true, function (iIdx) {
                                    oTable.cursor(iIdx,false); //定位
                                    self.recordSet.fieldByName('详细信息.汇率').val(fBuyPri);
                                    self.recordSet.fieldByName('详细信息.发布时间').val(oRate[i].date + ' ' + oRate[i].time);
                                    var oSQL = _.db.execute('Exchangerate_Select_CNY', {
                                        "values": {
                                            "sCNY": sCNY
                                        }
                                    });
                                    if (oSQL.length > 0) {
                                        if (oSQL[0].Rate - fBuyPri != 0) {
                                            _.db.execute('Exchangerate_Update_Dic_Currency', {
                                                "values": {
                                                    "sCNY": sCNY,
                                                    "fRate": fBuyPri
                                                }
                                            });
                                        }
                                    }
                                });
                                oTable.cursor(iBookMark,true);
                            }
                            _.ui.closeWatting(); //关闭等待框
                        }
                    });
                });
            } catch (err) {
                _.ui.showError('操作失败！');
                _.ui.closeWatting(); //关闭等待框
            }
        }

        var fnIsDate = function (callback) {
            var dToday = (new Date()).Format("yyyy-MM-dd");
            var dDate = (_.convert.toDateTime(self.recordSet.fieldByName('日期').val())).Format("yyyy-MM-dd");
            if (_.date.dateDiff(dToday, dDate) != 0) {
                callback(false)
            } else {
                callback(true)
            }
        }

        self.addButton("bExtend", _.language.get("扩展"), "", "yelp", true, true); //下拉菜单
        self.button('bExtend').addButton("bDownExchange", _.language.get("从[中国银行]下载并导入汇率"), function () {
            fnIsDate(function (res) {
                if (res == true) {
                    fnExchangerate_DownExchange();
                } else {
                    _.ui.showError(_.language.get('[日期]为非当天日期，无法下载汇率！'));
                }
            });
        });

        self.button('bExtend').addButton("bUpdateExchange", _.language.get("从[中国银行]获取并更新汇率"), function () {
            fnIsDate(function (res) {
                if (res == true) {
                    fnExchangerate_UpdateExchange();
                } else {
                    _.ui.showError(_.language.get('[日期]为非当天日期，无法下载汇率！'));
                }
            });
        });
    }
}
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], btn_Exchangerate);