import { RemoveEventHandler } from "./RemoveEventHandler";
export interface WidgetContract {
  /**
   * The root element
   */
  readonly dom: HTMLElement;
  dispose(): void;
  on(topic: string, cb: (result: any) => void): RemoveEventHandler;
  publish(topic: string, ...args: any): void;
}
