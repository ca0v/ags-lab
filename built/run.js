/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 */
"use strict";
var use_jsonp = true;
var Ajax = (function () {
    function Ajax(url) {
        this.url = url;
    }
    Ajax.prototype.jsonp = function (args, url) {
        if (url === void 0) { url = this.url; }
        // Creating a promise
        var promise = new Promise(function (resolve, reject) {
            args["callback"] = "define";
            var uri = url + "?" + Object.keys(args).map(function (k) { return (k + "=" + args[k]); }).join('&');
            require([uri], function (data) { return resolve(data); });
        });
        return promise;
    };
    Ajax.prototype.ajax = function (method, args, url) {
        if (url === void 0) { url = this.url; }
        if (use_jsonp)
            return this.jsonp(args, url);
        var promise = new Promise(function (resolve, reject) {
            var client = new XMLHttpRequest();
            var uri = url;
            if (args) {
                uri += '?';
                var argcount = 0;
                for (var key in args) {
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
            client.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    // Performs the function "resolve" when this.status is equal to 2xx
                    resolve(this.response);
                }
                else {
                    // Performs the function "reject" when this.status is different than 2xx
                    reject(this.statusText);
                }
            };
            client.onerror = function () {
                reject(this.statusText);
            };
        });
        // Return the promise
        return promise;
    };
    Ajax.prototype.get = function (args) {
        return this.ajax('GET', args);
    };
    Ajax.prototype.post = function (args) {
        return this.ajax('POST', args);
    };
    Ajax.prototype.put = function (args) {
        return this.ajax('PUT', args);
    };
    Ajax.prototype.delete = function (args) {
        return this.ajax('DELETE', args);
    };
    return Ajax;
})();
