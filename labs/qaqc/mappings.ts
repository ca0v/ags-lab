let mappings = {
    source: {
        url: "http://usalvwdgis1:6080/arcgis/rest/services/Annotations/H840_Annotations/FeatureServer/3",
        type: "ags"
    },
    target: {
        url: "http://usalvwdgis1:6080/arcgis/rest/services/Annotations/H840_Annotations/FeatureServer/3",
        type: "wfs"        
    },
    mapping: {
        "GlobalID": "globalid",
        "H8EXPDATE": "h8expdate",
        "last_edited_user": "last_edited_user",
        "last_edited_date": "last_edited_date",
        "shape": "geom"
    }
}