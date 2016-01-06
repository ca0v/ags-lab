/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 */
"use strict";
class Ajax {

    constructor (public url: string) {        
    }
    
    // Method that performs the ajax request
    private ajax(method: string, args?: any, url = this.url) {

      // Creating a promise
      var promise = new Promise( (resolve, reject) => {

        // Instantiates the XMLHttpRequest
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
          } else {
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
    }  

    get(args?: any) {
      return this.ajax('GET', args);
    }
    
    post(args?: any) {
      return this.ajax('POST', args);
    }
    
    put(args?: any) {
      return this.ajax('PUT', args);
    }
    
    delete(args?: any) {
      return this.ajax('DELETE', args);
    }
}