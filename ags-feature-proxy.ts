/**
 * http://sampleserver6.arcgisonline.com/arcgis/rest/services/Military/FeatureServer 
 */

interface SpatialReference {
    wkid: number;
    latestWkid: number;
}

interface Extent {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
    spatialReference: SpatialReference;
}

interface DocumentInfo {
    Title: string;
    Author: string;
    Comments: string;
    Subject: string;
    Category: string;
    Keywords: string;
}

interface Layer {
    id: number;
    name: string;
}

interface FeatureServerInfo {
    currentVersion: number;
    serviceDescription: string;
    hasVersionedData: boolean;
    supportsDisconnectedEditing: boolean;
    syncEnabled: boolean;
    supportedQueryFormats: string;
    maxRecordCount: number;
    capabilities: string;
    description: string;
    copyrightText: string;
    spatialReference: SpatialReference;
    initialExtent: Extent;
    fullExtent: Extent;
    allowGeometryUpdates: boolean;
    units: string;
    documentInfo: DocumentInfo;
    layers: Layer[];
    tables: any[];
    enableZDefaults: boolean;
    zDefault: number;
}

export interface AdvancedQueryCapabilities {
    supportsPagination: boolean;
    supportsStatistics: boolean;
    supportsOrderBy: boolean;
    supportsDistinct: boolean;
}

export interface EsriTSSymbol {
    type: string;
    color: number[];
    backgroundColor?: any;
    borderLineColor?: any;
    borderLineSize?: any;
    verticalAlignment: string;
    horizontalAlignment: string;
    rightToLeft: boolean;
    angle: number;
    xoffset: number;
    yoffset: number;
    kerning: boolean;
    haloColor?: any;
    haloSize?: any;
    font: Font;
}

export interface DefaultSymbol {
    type: string;
    url: string;
    imageData: string;
    contentType: string;
    width: number;
    height: number;
    angle: number;
    xoffset: number;
    yoffset: number;
}

export interface UniqueValueInfo {
    symbol: DefaultSymbol;
    value: string;
    label: string;
    description: string;
}

export interface Renderer {
    type: string;
    field1: string;
    field2?: any;
    field3?: any;
    fieldDelimiter: string;
    defaultSymbol: DefaultSymbol;
    defaultLabel: string;
    uniqueValueInfos: UniqueValueInfo[];
}

export interface Font {
    family: string;
    size: number;
    style: string;
    weight: string;
    decoration: string;
}

export interface LabelingInfo {
    labelPlacement: string;
    where?: any;
    labelExpression: string;
    useCodedValues: boolean;
    symbol: DefaultSymbol & EsriTSSymbol;
    minScale: number;
    maxScale: number;
}

export interface DrawingInfo {
    renderer: Renderer;
    transparency: number;
    labelingInfo: LabelingInfo[];
}

export interface CodedValue {
    name: string;
    code: any;
}

export interface Domain {
    type: string;
    name: string;
    codedValues: CodedValue[];
    range: number[];
}

export interface Field {
    name: string;
    type: string;
    alias: string;
    domain: Domain;
    editable: boolean;
    nullable: boolean;
    length?: number;
}

export interface Domains {
    [n: string]: {
        type: string
    };
}

export interface Attributes {
    [n: string]: string;
}

export interface Prototype {
    attributes: Attributes;
}

export interface Template {
    name: string;
    description: string;
    prototype: Prototype;
    drawingTool: string;
}

export interface Type {
    id: string;
    name: string;
    domains: Domains;
    templates: Template[];
}

export interface FeatureLayerInfo {
    currentVersion: number;
    id: number;
    name: string;
    type: string;
    description: string;
    copyrightText: string;
    defaultVisibility: boolean;
    editFieldsInfo?: any;
    ownershipBasedAccessControlForFeatures?: any;
    syncCanReturnChanges: boolean;
    relationships: any[];
    isDataVersioned: boolean;
    supportsRollbackOnFailureParameter: boolean;
    supportsStatistics: boolean;
    supportsAdvancedQueries: boolean;
    advancedQueryCapabilities: AdvancedQueryCapabilities;
    geometryType: string;
    minScale: number;
    maxScale: number;
    extent: Extent;
    drawingInfo: DrawingInfo;
    hasM: boolean;
    hasZ: boolean;
    enableZDefaults: boolean;
    zDefault: number;
    allowGeometryUpdates: boolean;
    hasAttachments: boolean;
    htmlPopupType: string;
    objectIdField: string;
    globalIdField: string;
    displayField: string;
    typeIdField: string;
    fields: Field[];
    types: Type[];
    templates: any[];
    maxRecordCount: number;
    supportedQueryFormats: string;
    capabilities: string;
    useStandardizedQueries: boolean;
}


export default class FeatureServer {
    private ajax: Ajax;

    constructor(url: string) {
        this.ajax = new Ajax(url);
    }

    about(data?: any) {

        let req = Object.assign({
            f: "pjson"
        }, data);

        return this.ajax.get<FeatureServerInfo>(req);
    }
    
    aboutLayer(layer: number) {
        
        let ajax = new Ajax(`${this.ajax.url}/${layer}`);
        let req = Object.assign({
            f: "pjson"
        }, {});

        return ajax.get<FeatureLayerInfo>(req);
    }

    public static test() {
        let service = new FeatureServer("http://sampleserver6.arcgisonline.com/arcgis/rest/services/Military/FeatureServer");
        service
            .about()
            .then(value => {
                console.log("about", value);
                console.log("currentVersion", value.currentVersion);
                service.aboutLayer(2).then(value => {
                    console.log("layer2", value);
                })
            });
    }
}