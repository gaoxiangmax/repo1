DROP VIEW IF EXISTS ItemsCatelogueNameDetail1 ;
CREATE VIEW ItemsCatelogueNameDetail1 AS(SELECT ItemNO, Count( QuotationsLine.rid ) f1 FROM QuotationsLine, Quotations WHERE QuotationsLine.pid = Quotations.rid GROUP BY ItemNO);

DROP VIEW IF EXISTS ItemsCatelogueNameDetail2 ;
CREATE VIEW ItemsCatelogueNameDetail2 AS(SELECT ItemNO, Count( SendSamplesLine.rid ) f1 FROM SendSamplesLine, SendSamples WHERE SendSamplesLine.pid = SendSamples.rid GROUP BY ItemNO);

DROP VIEW IF EXISTS ItemsCatelogueNameDetail3 ;
CREATE VIEW ItemsCatelogueNameDetail3 AS(SELECT ItemNO, Count( ReceiveSamplesLine.rid ) f1 FROM ReceiveSamplesLine, ReceiveSamples WHERE ReceiveSamplesLine.pid = ReceiveSamples.rid GROUP BY ItemNO);

DROP VIEW IF EXISTS ItemsCatelogueNameDetail4 ;
CREATE VIEW ItemsCatelogueNameDetail4 AS(SELECT ItemNO,SUM( SalesOrdersline.OrderQty ) f1,SUM( SalesAmount ) f2 FROM SalesOrdersline,SalesOrders WHERE SalesOrdersline.pid = SalesOrders.rid 
GROUP BY ItemNO);

DROP VIEW IF EXISTS ItemsCatelogueNameDetail5 ;
CREATE VIEW ItemsCatelogueNameDetail5 AS(SELECT ItemNO,SUM( PurchaseOrdersLine.OrderQty ) f1,SUM( PurchaseAmount ) f2 FROM PurchaseOrdersLine,PurchaseOrders WHERE PurchaseOrdersLine.pid = PurchaseOrders.rid 
GROUP BY ItemNO);

DROP VIEW IF EXISTS ItemsCatelogueNameDetail6 ;
CREATE VIEW ItemsCatelogueNameDetail6 AS(SELECT ItemNO,SUM( ShipmentsLine.ShippingQty ) f1,SUM( ShipmentsLine.SalesAmount ) f2 FROM ShipmentsLine,Shipments WHERE ShipmentsLine.pid = Shipments.rid 
GROUP BY ItemNO);

DROP VIEW IF EXISTS ItemsCatelogueNameDetail7 ;
CREATE VIEW ItemsCatelogueNameDetail7 AS(SELECT ItemNO, Count( rid ) f1, SUM( PayedAmount ) f2 FROM Complaints GROUP BY ItemNO);

DROP VIEW IF EXISTS ItemsCatelogueName ;
CREATE VIEW ItemsCatelogueName AS (
SELECT
CASE
	IFNULL( sys_module_catalogue.NAME, 'Items_Root' ) 
	WHEN 'Items_Root' THEN
	'未归类' ELSE sys_module_catalogue.NAME 
	END AS CatelogueName,
	IFNULL( tb1.f1, 0 ) QuotationsCount,
	IFNULL( tb2.f1, 0 ) SendSamplesCount,
	IFNULL( tb3.f1, 0 ) ReceiveSamplesCount,
	IFNULL( tb4.f1, 0 ) SalesOrdersQty,
	IFNULL( tb4.f2, 0 ) SalesOrdersAmount,
	IFNULL( tb5.f1, 0 ) PurchaseOrderQty,
	IFNULL( tb5.f2, 0 ) PurchaseOrdersAmount,
	IFNULL( tb6.f1, 0 ) ShippingQty,
	IFNULL( tb6.f2, 0 ) ShippingAmount,
	IFNULL( tb7.f1, 0 ) ComplaintsCount,
	IFNULL( tb7.f2, 0 ) ComplaintsAmount 
FROM
	Items
	LEFT JOIN ItemsCatelogueNameDetail1 tb1 ON Items.ItemNO = tb1.ItemNO
	LEFT JOIN ItemsCatelogueNameDetail2 tb2 ON Items.ItemNO = tb2.ItemNO
	LEFT JOIN ItemsCatelogueNameDetail3 tb3 ON Items.ItemNO = tb3.ItemNO
	LEFT JOIN ItemsCatelogueNameDetail4 tb4 ON Items.ItemNO = tb4.ItemNO
	LEFT JOIN ItemsCatelogueNameDetail5 tb5 ON Items.ItemNO = tb5.ItemNO
	LEFT JOIN ItemsCatelogueNameDetail6 tb6 ON Items.ItemNO = tb6.ItemNO
	LEFT JOIN ItemsCatelogueNameDetail7 tb7 ON Items.ItemNO = tb7.ItemNO
	LEFT JOIN sys_module_catalogue ON Items.cat_id = sys_module_catalogue.rid 
	)