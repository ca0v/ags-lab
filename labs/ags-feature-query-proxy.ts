/**
 * http://sampleserver6.arcgisonline.com/arcgis/sdk/rest/index.html#//02ss0000002r000000 
 */

import lang = require("dojo/_base/lang");
import Ajax = require("./ajax");

interface QueryResponse {
    objectIdFieldName: string;
    globalIdFieldName: string;
    fields: Array<{
        name: string;
        alias: string;
        type: string;
        length: number;
    }>;
    features: Array<{
        attributes: any;
    }>;
}

export default class Query {
    private ajax: Ajax;

    constructor(url: string) {
        this.ajax = new Ajax(url);
    }

    query(data: {
        where?: string;
        objectIds?: Array<string>;
        geometry?: any;
        geometryType?: string;
        inSR?: number;
        spatialRel?: string;
        relationParam?: string;
        time?: number;
        distance?: number;
        units?: string;
        outFields?: Array<string>;
        returnGeometry?: boolean;
        maxAllowableOffset?: number;
        geometryPrecision?: number;
        outSR?: number;
        returnDistinctValues?: boolean;
        returnIdsOnly?: boolean;
        returnCountOnly?: boolean;
        returnExtentOnly?: boolean;
        orderByFields?: string;
        groupByFieldsForStatistics?: Array<string>;
        outStatistics?: Array<{
            statisticType: string;
            outStatisticField: string;
            outStatisticFieldName: string;
        }>;
        returnZ?: boolean;
        returnM?: boolean;
        multipatchOption?: string;
        resultOffset?: number;
        resultRecordCount?: number;
    }) {

        let req = lang.mixin({
            where: "1=1",
            inSR: 4326,
            outSR: 4326,
            returnDistinctValues: true,
            returnGeometry: false,
            returnCountOnly: false,
            f: "pjson"
        }, data);

        if (req.objectIds) req.objectIds = <any>req.objectIds.join(',');
        if (req.outFields) req.outFields = <any>req.outFields.join(',');
        if (req.groupByFieldsForStatistics) req.groupByFieldsForStatistics = <any>req.groupByFieldsForStatistics.join(',');

        return this.ajax.get(req);
    }

}

export function run() {
    new Query("https://sampleserver6.arcgisonline.com/arcgis/rest/services/Military/FeatureServer/3/query")
        .query({
            outFields: ["symbolname"],
            returnDistinctValues: true
        })
        .then((value: QueryResponse) => {
            console.log("query", value);
        });
} 
