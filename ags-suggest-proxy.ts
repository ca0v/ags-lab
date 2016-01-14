import lang = require("dojo/_base/lang");

export default class Suggest {
    
    private ajax: Ajax;
    
    constructor(url: string) {
        this.ajax = new Ajax(url);
    }
    
    suggest(data: {
        text: string;
        location?: string;
        distance?: number;
        category?: string;
        searchExtent?: string;
        maxSuggestions?: number;
        countryCode?: string;
    }) {
        let req = lang.mixin({
           f: "pjson",
           category: "Address",
           countryCode: "USA"
        }, data);
        
        return this.ajax.get(req);
    }
    
    public static test() {
        new Suggest("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest")
        .suggest({text: "50 Datastream Plaza, Greenville SC"})
        .then((value: {
                suggestions: Array<{
                    isCollection: boolean;
                    magicKey: string;
                    text: string;
                }>
            }) => {
                // how to get route to return json?
                value = JSON.parse(<any>value);
                console.log("text", value.suggestions.map(s => s.text));            
                console.log(value);
        });
    }  
}
