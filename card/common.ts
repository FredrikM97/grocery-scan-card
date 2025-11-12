import { DEFAULT_HA_COMPONENTS } from "@kipk/load-ha-components";

// Utility to add an event listener that sets an 'open' property to true
export function addOpenOnEventListener(
  node: HTMLElement,
  eventName: string,
  openProp: string = "open",
) {
  node.addEventListener(eventName, () => {
    (node as any)[openProp] = true;
  });
}

// Minimal fireEvent utility for custom events
export function fireEvent(node: HTMLElement, type: string, detail?: any) {
  const event = new CustomEvent(type, {
    bubbles: true,
    composed: true,
    detail,
  });
  node.dispatchEvent(event);
}

export const HA_CARD_REQUIRED_HA_COMPONENTS=["ha-entity-picker", "ha-form", "ha-textfield", "ha-dialog", "ha-button","ha-data-table", "ha-textfield"]