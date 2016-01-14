/**
 * http://sampleserver1.arcgisonline.com/ArcGIS/SDK/REST/query.html
 */

/**
 * mapserver query 
 */
export default class Query {
    private ajax: Ajax;

    constructor(url: string) {
        this.ajax = new Ajax(url);
    }

    query(data: {
        text: string;
        geometry?: Array<number>;
        geometryType?: string;
        inSR?: number;
        spatialRel?: string;
        relationParam?: string;
        where?: string;
        objectIds?: Array<string>;
        time?: number;
        outFields?: Array<string>;
        returnGeometry?: boolean;
        maxAllowableOffset?: number;
        outSR?: number;
        returnIdsOnly?: boolean;
        returnCountOnly?: boolean;
    }) {

        let req = Object.assign({
            inSR: 4326,
            outSR: 4326,
            f: "pjson"
        }, data);

        if (req.outFields) req.outFields = <any>req.outFields.join(",");

        return this.ajax.get<{
            displayFieldName: string;
            fieldAliases: any;
            geometryType: string;
            spatialReference: { wkid: number };
            fields: Array<{
                name: string;
                type: string;
                alias: string;
                length: number;
            }>;
            features: Array<{
                attributes: any;
                geometry: any;
            }>;
        }>(req);
    }

    public static test() {
        new Query("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StateCityHighway_USA/MapServer/1/query")
            .query({
                text: "South Carolina"
            })
            .then(value => console.log("query", value));
    }
}