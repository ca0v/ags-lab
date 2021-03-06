/** 
 * https://davidwalsh.name/pubsub-javascript
 */
interface Dictionary<T> {
  [n: string]: T;
}

export default class PubSub {
  private topics = <Dictionary<Function[]>>{};

  subscribe(topic: string, listener: Function) {
    if (!this.topics[topic]) this.topics[topic] = [];

    var index = this.topics[topic].push(listener) - 1;

    return {
      remove: () => delete this.topics[topic][index]
    };
  }

  publish(topic: string, info = {}) {
    if (!this.topics[topic]) return;
    this.topics[topic].forEach(item => item(info));
  }

}

export function run() {
  let topic = new PubSub();
  topic.subscribe("hello", args => console.log("hello", args));
  topic.publish("hello", 1);
}