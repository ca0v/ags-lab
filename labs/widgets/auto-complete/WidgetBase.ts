import { RemoveEventHandler } from "./typings/RemoveEventHandler";
import { WidgetContract } from "./typings/WidgetContract";
import { Channel } from "./Channel";

export class WidgetBase implements WidgetContract {
  public dom: HTMLElement;
  public channel: Channel;
  
  /**
   * Create a default dom container for a generic widget
   */
  constructor() {
    this.dom = document.createElement("div");
    this.dom.className = "widget";
    this.channel = new Channel();
  }

  dispose(): void {
    this.dom.remove();
  }

  subscribe(topic: string, cb: (result: any) => void): RemoveEventHandler {
    return this.channel.on(topic, cb);
  }

  publish(topic: string, ...args: any) {
    return this.channel.publish(topic, ...args);
  }
}
