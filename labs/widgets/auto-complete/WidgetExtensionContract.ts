import { WidgetContract } from "./WidgetContract";
export interface WidgetExtensionContract<WidgetType extends WidgetContract> {
  initialize(widget: WidgetType): void;
}
