interface WebMap {
    layers: Layer[];
    minScale: number;
    maxScale: number;
    operationalLayers: OperationalLayer[];
    baseMap: BaseMap;
    spatialReference: SpatialReference;
    authoringApp: string;
    authoringAppVersion: string;
    version: string;
    bookmarks: Bookmark[];
    applicationProperties: ApplicationProperties;
    MapItems?: any;
    Slides?: any;
}

interface Format {
    places: number;
    digitSeparator: boolean;
    dateFormat: string;
}

interface FieldInfo {
    fieldName: string;
    label: string;
    isEditable: boolean;
    tooltip: string;
    visible: boolean;
    format: Format;
    stringFieldOption: string;
}

interface PopupInfo {
    title: string;
    fieldInfos: FieldInfo[];
    description?: any;
    showAttachments: boolean;
    mediaInfos: any[];
}

interface OperationalLayer {
    id: string;
    layerType: string;
    url: string;
    visibility: boolean;
    opacity: number;
    title: string;
    // in addition to base layer
    featureCollection?: FeatureCollection;
    mode?: number;
    popupInfo?: PopupInfo;
}

interface BaseMapLayer {
    id: string;
    layerType: string;
    url: string;
    visibility: boolean;
    opacity: number;
    title: string;
}

interface SpatialReference {
    wkid: number;
    latestWkid: number;
}

interface Extent {
    spatialReference: SpatialReference;
    xmax: number;
    xmin: number;
    ymax: number;
    ymin: number;
}

interface Bookmark {
    extent: Extent;
    name: string;
}

interface Routing {
    enabled: boolean;
}

interface BasemapGallery {
    enabled: boolean;
}

interface Measure {
    enabled: boolean;
}

interface Viewing {
    routing: Routing;
    basemapGallery: BasemapGallery;
    measure: Measure;
}

interface ApplicationProperties {
    viewing: Viewing;
}

interface MediaInfo {
    title: string;
    type: string;
    caption: string;
    value: Value;
}

interface Layer {
    id: number;
    showLegend: boolean;
    popupInfo: PopupInfo;
    layerDefinition: LayerDefinition;
    featureSet: FeatureSet;
    nextObjectId: number;
}

interface Outline {
    style: string;
    color: number[];
    width: number;
    type: string;
}

interface Font {
    weight: string;
    style: string;
    family: string;
    size: number;
}

interface Symbol {
    style: string;
    color: number[];
    outline: Outline;
    type: string;
    width?: number;
    horizontalAlignment: string;
    verticalAlignment: string;
    font: Font;
    imageData: string;
    height?: number;
    xoffset?: number;
    yoffset?: number;
    contentType: string;
    url: string;
    size?: number;
}

interface UniqueValueInfo {
    symbol: Symbol;
    description: string;
    value: string;
    label: string;
}

interface Renderer {
    field1: string;
    type: string;
    uniqueValueInfos: UniqueValueInfo[];
}

interface DrawingInfo {
    renderer: Renderer;
}

interface Prototype {
    attributes: Attributes;
}

interface Template {
    drawingTool: string;
    description: string;
    name: string;
    prototype: Prototype;
}

interface Domains {
}

interface Type {
    id: number;
    templates: Template[];
    domains: Domains;
    name: string;
}

interface Field {
    alias: string;
    name: string;
    type: string;
    editable: boolean;
    length?: number;
}

interface LayerDefinition {
    objectIdField: string;
    templates: any[];
    type: string;
    drawingInfo: DrawingInfo;
    displayField: string;
    visibilityField: string;
    name: string;
    hasAttachments: boolean;
    typeIdField: string;
    capabilities: string;
    types: Type[];
    geometryType: string;
    fields: Field[];
    extent: Extent;
}

interface Value {
    sourceURL: string;
    linkURL: string;
}

interface Geometry {
    rings: number[][][];
    spatialReference: SpatialReference;
    paths: number[][][];
    x?: number;
    y?: number;
}

interface Attributes {
    VISIBLE: number;
    TITLE: string;
    TYPEID: number;
    OBJECTID: number;
    DESCRIPTION: string;
}

interface Feature {
    geometry: Geometry;
    attributes: Attributes;
    symbol: Symbol;
}

interface FeatureSet {
    geometryType: string;
    features: Feature[];
}

interface FeatureCollection {
    layers: Layer[];
    showLegend: boolean;
}

interface BaseMap {
    baseMapLayers: BaseMapLayer[];
    title: string;
}

import utils = require("esri/arcgis/utils");
import Map = require("esri/map");
import Portal = require("esri/portal/Portal");
import OAuthInfo = require("esri/arcgis/OAuthInfo");
import IdentityManager = require("esri/IdentityManager");

//https://www.arcgis.com/sharing/oauth2/approve?oauth_state=GD6ps1QHrIq-evMlDEj9BkwQqP8qtCMm-r1-zNkUobLFtk4E04D7TJ4Cn0pkeZ56svApgSHK9iRY7HasLI4YrUYIP5wunF_syiATUiY4hyenri_P2OazODUVl28SwOONAOZKzbRVIHamNdtpSo_sBtl_ahDqHArMbiV3dxkDMgr5eLWYpaJxFpGIdMpj0bjaSz_OcgrHej3jmUT-RBRlQrKhgFdHmFmf0k8zhfKIYx8GnlzS6BqZqNo8Hz0ZIpQuTAfza-qg4ZyhMS8DhEI377hLlrb5PMcTeDl7-NpMlfyDjWHecmI0OmOLEOaMSy58LYaFJtZIH46c7fKvE5ESZg..

// https://www.arcgis.com/sharing/oauth2/authorize?client_id=313b7327133f4802affee46893b4bec7&response_type=token&state=%7B%22portalUrl%22%3A%22https%3A%2F%2Fwww.arcgis.com%22%7D&expiration=20160&redirect_uri=http%3A%2F%2Flocalhost%2Fags-lab%2Foauth-callback.html
export function run(appId = "vK2LJni4ozSNXdmj") {
    debugger; "hereiam: cannot access without OAUTH configuration...read email from Brian"

    let response = {
        "error": {
            "code": 403,
            "messageCode": "GWM_0003",
            "message": "You do not have permissions to access this resource or perform this operation.", "details": []
        }
    };

    var info = new OAuthInfo({
        appId: appId,
        // Uncomment the next line and update if using your own portal
        // portalUrl: "https://<host>:<port>/arcgis"
        // Uncomment the next line to prevent the user's signed in state from being shared
        // with other apps on the same domain with the same authNamespace value.
        // authNamespace: "portal_oauth_inline",
        popup: false
    });

    // typings wrong..it has no constructor
    let id = <IdentityManager><any>IdentityManager;
    id.registerOAuthInfos([info]);

    console.log("info", info, "id", id);

    let cred = id.getCredential(info.portalUrl + "/sharing").then(() => {
        debugger;
    }).otherwise(() => {
    });

    id.checkSignInStatus(info.portalUrl + "/sharing").then(() => {
        debugger;
    }).otherwise(() => {
    });

    false && utils.createMap(appId, "map").then((response: {
        map: Map,
        itemInfo: {
            info: { title: string; snippet: string },
            itemData: WebMap
        }
    }) => {
        debugger;
        // now we can use the map
        response.itemInfo.itemData;
        // and we have the webmap configuration
        response.itemInfo.itemData.operationalLayers;
    });
};