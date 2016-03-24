/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 */

"use strict";

class Ajax {

    constructor(public url: string, public use_jsonp = true) {
    }

    private jsonp<T>(args?: any, url = this.url) {
        // Creating a promise
        let promise = new Promise<T>((resolve, reject) => {

            args["callback"] = "define";
            let uri = url + "?" + Object.keys(args).map(k => `${k}=${args[k]}`).join('&');
            require([uri], (data: T) => resolve(data));
        });

        return promise;
    }

    private ajax<T>(method: string, args?: any, url = this.url) {

        let promise = new Promise<T>((resolve, reject) => {

            let client = new XMLHttpRequest();
            let uri = url;

            if (args) {
                uri += '?';
                let argcount = 0;
                for (let key in args) {
                    if (args.hasOwnProperty(key)) {
                        if (argcount++) {
                            uri += '&';
                        }
                        uri += encodeURIComponent(key) + '=' + encodeURIComponent(args[key]);
                    }
                }
            }

            client.open(method, uri);
            client.send();

            client.onload = function() {
                if (this.status >= 200 && this.status < 300) {
                    // Performs the function "resolve" when this.status is equal to 2xx
                    resolve(this.response);
                } else {
                    // Performs the function "reject" when this.status is different than 2xx
                    reject(this.statusText);
                }
            };
            client.onerror = function() {
                reject(this.statusText);
            };
        });

        // Return the promise
        return promise;
    }

    stub<T>(result: T) {
        return new Promise<T>((resolve, reject) => {
            resolve(result);
        });
    }

    get<T>(args?: any) {
        if (this.use_jsonp) return this.jsonp<T>(args);
        return this.ajax<T>('GET', args);
    }

    post<T>(args?: any) {
        return this.ajax<T>('POST', args);
    }

    put<T>(args?: any) {
        return this.ajax<T>('PUT', args);
    }

    delete(args?: any) {
        return this.ajax('DELETE', args);
    }
}

export = Ajax;