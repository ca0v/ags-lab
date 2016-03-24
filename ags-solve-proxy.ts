import Ajax = require("./ajax");

export default class BaseSolve {
    protected ajax: Ajax;
    
    constructor(url: string) {
        this.ajax = new Ajax(url);
    }
    
    solve<T>(data: T) {
        return this.ajax.get(data);
    };
    
    static test() {
        throw "this is an abstract class for route, closest facility and service area";
    }
}
