DROP VIEW IF EXISTS ItemsCombinationDetail ;
CREATE VIEW ItemsCombinationDetail AS (Select
            pid,
            MinimumQty,
            OuterCapacity,
            Packing,
            OuterLength,
            OuterWidth,
            OuterHeight,
            OuterVolume,
            OuterGrossWeight,
            OuterNetWeight
        From
            ItemsQuote
        Where
            sid In (
                Select
                    Min(sid)
                From
                    ItemsQuote
                Group By
                    pid
            ));

DROP VIEW IF EXISTS ItemsCombination ;
CREATE VIEW ItemsCombination AS (
Select
    rid,
    ItemNo,
    Barcode,
    ENGItemName,
    ENGSpecification,
    SalesPrice,
    Unit,
    ENGMemo,
    UserDefaultField1,
    UserDefaultField2,
    UserDefaultField3,
    UserDefaultField4,
    UserDefaultField5,
    UserDefaultField6,
    UserDefaultField7,
    (Tb.MinimumQty) as MinimumQty,
    (Tb.OuterCapacity) as OuterCapacity,
    (Tb.Packing) as Packing,
    (Tb.OuterLength) as OuterLength,
    (Tb.OuterWidth) as OuterWidth,
    (Tb.OuterHeight) as OuterHeight,
    (Tb.OuterVolume) as OuterVolume,
    (Tb.OuterGrossWeight) as OuterGrossWeight,
    (Tb.OuterNetWeight) as OuterNetWeight
From
    Items
    Left Join ItemsCombinationDetail Tb On Tb.pid = Items.rid
)