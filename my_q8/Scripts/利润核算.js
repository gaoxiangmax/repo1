//---<利润核算_海运费币种>
function evt_ProfitAccounting_SeaFreightCurrency(obj) {
    var self = obj.form;
    if (self.moduleName == '利润核算') {
        if (self.recordSet.fieldByName('海运费汇率').val()) {
            return;
        }
        if (window.aconfig) {
            var oSQL = _.db.execute('Shipments_Select_Dic_Currency', {
                "values": {
                    "sCurrencyCode": window.aconfig.Shipments_SeaFreightCurrencyCoBx
                }
            });
            if (oSQL.length == 0) {
                _.ui.showWarnning(_.language.get('业务字典-货币代码未完善汇率栏目:') + window.aconfig.Shipments_SeaFreightCurrencyCoBx);
            } else {
                self.recordSet.fieldByName('海运费币种').val(window.aconfig.Shipments_SeaFreightCurrencyCoBx);
                self.recordSet.fieldByName('海运费汇率').val(oSQL[0].Rate);
            }
        } else {
            var oSQL = _.db.execute('Shipments_Select_Dic_Currency', {
                "values": {
                    "sCurrencyCode": 'USD'
                }
            });
            if (oSQL.length == 0) {
                _.ui.showWarnning(_.language.get('业务字典-货币代码未完善美金汇率栏目！'));
            } else {
                self.recordSet.fieldByName('海运费币种').val('USD');
                self.recordSet.fieldByName('海运费汇率').val(oSQL[0].Rate);
            }
        }
    }
};
addListener([EVT_EDITFORM_CREATED, EVT_RECORDSET_AFTER_NEW, EVT_RECORDSET_AFTER_COPY], evt_ProfitAccounting_SeaFreightCurrency);

//---<利润核算_计算利润金额>
var fnProfitAccounting = function (self) {
    //公式说明：
    //一、自营
    //单产品毛利=(FOB价格 * 销售汇率 - 采购单价 * 采购汇率) * 数量
    //1.其中FOB价格 = 销售单价 - 运费项 + 退税项 -销售单价*保险项-销售单价*佣金项=销售单价*(1-保险项-佣金项)-运费项+退税，
    //so利润=[利润核算.产品毛利]-([利润核算.银行费用]+[利润核算.其他费用]-[利润核算.费用合计])*[利润核算.汇率]-[利润核算.运杂费]-[利润核算.其他费用￥];
    //2.其中运费项(外箱装量为空，则此结果为0)=单体积运费 * 外箱体积/ 外箱装量；
    //将海运费转换成销售币种对应的金额，其中单体积运费 (体积合计为空，则此结果为0):= 海运费*海运费汇率/汇率/ 体积合计；
    //3.其中退税项(只有采购币种为人民币，否则为0)=采购单价*退税率/(100+增值税率)/销售汇率；
    //4.其中保险项=保险加成*保险比率/10000；
    //5.其中佣金项=(货值合计*佣金比率/100)/货值合计；
    //
    //二、代理
    //单产品毛利=((FOB价格 - 采购单价 * 采购汇率 / 中间价) * 销售汇率) * 数量；
    //1.其中FOB价格 =(销售单价 - 运费项 ) / (1 + 保险项 + 佣金项);
    //2.其中中间价= 销售汇率 / 基准汇率 * 结汇比
    //整体产品汇率=以上各单品产品毛利之和
    //利润金额=产品毛利-(佣金金额+银行费用+其他费用-费用合计)*汇率-运杂费-其他费用￥
    //成本总额=采购合计+运杂费+其他费用￥
    //利润率=利润金额/成本总额*100

    //获取结汇比
    var fnGetSettlementRatio = function (iExportRebatesRate) {
        var fResult;
        var oSQL = _.db.execute('ProfitAccounting_Select_Dic_SettlementRate', {
            "values": {
                "sCompany": sExporter,
                "iExportRebatesRate": iExportRebatesRate
            }
        });
        if (oSQL.length == 0) {
            fResult = 0;
        } else {
            fResult = _.convert.toFloat(oSQL[0].SettlementRatio);
        }
        if (fResult) {
            return fResult;
        } else {
            return 0;
        }
    };

    //获取汇率
    var fnGetCurrencyRate = function (sCurrency) {
        var fResult;
        if (sCurrency == 'RMB' || sCurrency == 'CNY') {
            fResult = 1;
        } else {
            var oSQL = _.db.execute('ProfitAccounting_Select_Dic_Currency2', {
                "values": {
                    "sCurrencyCode": sCurrency
                }
            });
            if (oSQL.length > 0) {
                fResult = _.convert.toFloat(oSQL[0].Rate);
            }
        }
        if (fResult) {
            return fResult;
        } else {
            return 0;
        }
    };

    //获取退税
    var fnGetRebates = function (sPHCurrency, fERRate, iVAT, fPHPrice) {
        var fResult = 0;
        if (sPHCurrency == 'RMB' || sPHCurrency == 'CNY') {
            switch (sSettlement) {
                case '自营出口':
                    fResult = fPHPrice * fERRate / iVAT / fExchangeRate;
                    break;
                case '代理出口':
                    fResult = 0;
                    break;
            }
        }
        if (fResult) {
            return fResult;
        } else {
            return 0;
        }
    };
    //计算利润
    var fnGetProfit = function () {
        var sPurchCurrency;
        var fSalePrice, fPurchPrice, fPurchCurrencyRate, fFobPrice, fBuyoutPrice, fAUnitFreight;
        var fResult;
        fSalePrice = self.recordSet.fieldByName('产品资料.销售单价').val();
        fPurchPrice = self.recordSet.fieldByName('产品资料.采购单价').val();
        sPurchCurrency = self.recordSet.fieldByName('产品资料.采购币种').val();
        fPurchCurrencyRate = fnGetCurrencyRate(sPurchCurrency);
        if (self.recordSet.fieldByName('产品资料.外箱装量').val() > 0) {
            fAUnitFreight = fUnitFreight * self.recordSet.fieldByName('产品资料.外箱体积').val() / self.recordSet.fieldByName('产品资料.外箱装量').val();
        }
        if (fStandardRate > 0) {
            fBuyoutPrice = fExchangeRate / fStandardRate * fnGetSettlementRatio(iExportRebatesRate);
        } else {
            fBuyoutPrice = 0;
        }
        fFobPrice = fSalePrice * (1 - fPlusInsurance - fCommission) - fAUnitFreight + fnGetRebates(sPurchCurrency, iExportRebatesRate, iVAT, fPurchPrice);
        switch (sSettlement) {
            case '自营出口':
                fResult = (fFobPrice * fExchangeRate - fPurchPrice * fPurchCurrencyRate) * self.recordSet.fieldByName('产品资料.数量').val();
                break;
            case '代理出口':
                if (BuyoutPrice != 0) {
                    fResult = ((fFobPrice - fPurchPrice * fPurchCurrencyRate / fBuyoutPrice) * fExchangeRate) * self.recordSet.fieldByName('产品资料.数量').val();
                    break;
                }
        }
        if (fResult) {
            return fResult;
        }
    };

    var fExchangeRate, fCommission, fCommissionTotal, fUnitFreight, fPlusInsurance, fPurchTotal, fTaxRebateTotal, fProfitTotal, fStandardRate, iVAT, iExportRebatesRate;
    var sSettlement, sExporter;
    if (self.recordSet.fieldByName('货值合计').val() == 0) {
        return;
    }
    if (self.recordSet.fieldByName('汇率').val() == 0) {
        return;
    }
    sExporter = self.recordSet.fieldByName('我方公司').val();
    sSettlement = self.recordSet.fieldByName('结算类别').val();
    fExchangeRate = self.recordSet.fieldByName('汇率').val();
    fStandardRate = self.recordSet.fieldByName('基准汇率').val();
    fCommissionTotal = self.recordSet.fieldByName('佣金金额').val();
    fCommission = fCommissionTotal / self.recordSet.fieldByName('货值合计').val();
    if (self.recordSet.fieldByName('体积合计').val() != 0) {
        fUnitFreight = self.recordSet.fieldByName('海运费').val() * self.recordSet.fieldByName('海运费汇率').val() / fExchangeRate / self.recordSet.fieldByName('体积合计').val();
    }
    fPlusInsurance = self.recordSet.fieldByName('保险加成').val() * self.recordSet.fieldByName('保险比率').val() / 10000;
    fPurchTotal = 0;
    fTaxRebateTotal = 0;
    fProfitTotal = 0;
    var oTable = self.recordSet.tableByName('产品资料');
    oTable.disableControl();
    var iBookMark = oTable.cursor();
    oTable.cursor(0, false);
    try {
        oTable.down(function () {
            iExportRebatesRate = self.recordSet.fieldByName('产品资料.退税率').val();
            if (self.recordSet.fieldByName('产品资料.增值税率').val() == 0) {
                iVAT = 113;
            } else {
                iVAT = 100 + self.recordSet.fieldByName('产品资料.增值税率').val();
            }
            fPurchTotal = fPurchTotal + self.recordSet.fieldByName('产品资料.采购总价').val() *
                fnGetCurrencyRate(self.recordSet.fieldByName('产品资料.采购币种').val());
            if (self.recordSet.fieldByName('产品资料.采购币种').val() == 'RMB' ||
                self.recordSet.fieldByName('产品资料.采购币种').val() == 'CNY') {
                if (sSettlement == '自营出口') {
                    fTaxRebateTotal = fTaxRebateTotal + self.recordSet.fieldByName('产品资料.采购总价').val() *
                        self.recordSet.fieldByName('产品资料.退税率').val() / iVAT;
                }
            }
            fProfitTotal = fProfitTotal + fnGetProfit();
        });
    } finally {
        oTable.cursor(iBookMark, true);
        oTable.enableControl('Batch_ProfitAccounting');
    }

    self.recordSet.fieldByName('采购合计').val(Math.round(fPurchTotal * 100) / 100);
    if (fTaxRebateTotal > 0 && self.recordSet.fieldByName('价格条款').val() != 'EXW') {
        self.recordSet.fieldByName('退税总额').val(Math.round(fTaxRebateTotal * 100) / 100);
    } else {
        self.recordSet.fieldByName('退税总额').val(0);
    }
    self.recordSet.fieldByName('产品毛利').val(Math.round(fProfitTotal * 100) / 100);
};

function evt_ProfitAccounting_beforeSave(obj) {
    return new Promise((resolve, reject) => {
        var self = obj.form;
        if (self.moduleName == '利润核算') {
            fnProfitAccounting(self);
            resolve();
        } else {
            resolve();
        }
    });
}
addPromiseListener([EVT_RECORDSET_BEFORE_SAVE], evt_ProfitAccounting_beforeSave);

function cge_EditForm_ProfitAccounting(obj) {
    var self = obj.form;
    var cgeField = obj.field;
    if (self.moduleName == '利润核算') {
        //---<利润核算_价格条款>
        if (cgeField.fullName == '利润核算.价格条款') {
            VLIB.cxTermOfPrice(obj);
        }
        //---<利润核算_基准汇率可见>
        if (cgeField.fullName == '利润核算.结算类别') {
            if (self.recordSet.fieldByName('结算类别').val() == '代理出口') {
                self.field('基准汇率').show();
            } else {
                self.field('基准汇率').hide();
            }
        }

        //---<利润核算_计算利润金额>
        var aFullName = ['利润核算.结算类别', '利润核算.汇率', '利润核算.佣金比率', '利润核算.货值合计', '利润核算.海运费汇率', '利润核算.海运费',
            '利润核算.产品资料.采购币种', '利润核算.产品资料.采购总价', '利润核算.产品资料.销售总价', '利润核算.产品资料.退税率', '利润核算.产品资料.增值税率',
            '利润核算.产品资料.外箱装量'
        ];
        if (!obj.table.disabled() && $.inArray(cgeField.fullName, aFullName) != -1) {
            fnProfitAccounting(self);
        }
    }
}
addListener([EVT_RECORDSET_AFTER_FIELD_CHANGED], cge_EditForm_ProfitAccounting);

//---<利润核算_监听子表批量导入事件，以提高代码运行效率>
function evt_ProfitAccounting_Batchmode(obj) {
    var self = obj.form;
    if (self.moduleName == "利润核算") {
        if (obj.key == '产品资料') {
            fnProfitAccounting(self);
        }
    }
};
addListener([EVT_RECORDSET_TABLE_ENABLE], evt_ProfitAccounting_Batchmode);