import Ajax = require("./ajax");

export default class BaseSolve {
    protected ajax: Ajax;

    constructor(url: string) {
        this.ajax = new Ajax(url);
    }

    solve<T>(data: T) {
        return this.ajax.get(data);
    };

}

export function run() {
    console.log("this is an abstract class for route, closest facility and service area");
}
