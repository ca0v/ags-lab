/** 
 * https://davidwalsh.name/pubsub-javascript
 */
 interface Dictionary<T> {
     [n: string]: T;
 }
 
class PubSub {
  private topics = <Dictionary<Function[]>>{};

    subscribe(topic: string, listener: Function) {
      if(!this.topics[topic]) this.topics[topic] = [];

      var index = this.topics[topic].push(listener) -1;

      return {
        remove: () => delete this.topics[topic][index]
      };
    }
    
    publish(topic: string, info = {}) {
      if(!this.topics[topic]) return;
      this.topics[topic].forEach(item => item(info));
    }
    
}

let pubsub = new PubSub();
export = pubsub;