import { LitElement, html, css } from "lit";
import { property } from "lit/decorators.js";
import { fireEvent } from "../common";

/**
 * ActionButton - reusable button for actions in barcode-card
 * Usage:
 * <sl-action-button icon="mdi:camera" label="Scan" @action-click="..." />
 */
export class ActionButton extends LitElement {
  @property({ type: String }) icon = "";
  @property({ type: String }) label = "";
  @property({ type: Boolean }) outlined = false;
  @property({ type: Boolean }) disabled = false;

  static styles = css`
  :host {
    display: block;
    width: 100%;
  }
  .action-bar {
    display: flex;
    width: 100%;
  }
  ha-button {
    width: 100%;
    border-radius: 0 !important;
    margin: 0;
    box-shadow: none;
    min-width: 0;
    border: none;
    background: var(--ha-primary-background-color, #f5f5f5);
    color: var(--ha-primary-color, #1976d2);
    transition: background 0.2s, color 0.2s;
  }
  ha-button:hover {
    background: var(--ha-card-background, #fff);
    color: var(--ha-primary-color, #1565c0);
  }
  /* Subtle divider between buttons, only between (not around) */
  :host(:not(:first-child)) ha-button::part(base) {
    border-left: 1px solid var(--divider-color, #e0e0e0);
  }
  ha-button::part(base) {
    border-radius: 0 !important;
  }
  ha-icon {
    --mdc-icon-size: 20px;
    color: var(--ha-primary-color, #1976d2);
  }
`

  render() {
    return html`
      <div class="action-bar">
        <ha-button
          class="${this.outlined ? "outlined" : ""}"
          ?disabled="${this.disabled}"
          @click="${(e: Event) => fireEvent(this, "action-click", { detail: e })}"
        >
          <ha-icon icon="${this.icon}"></ha-icon>
          <span>${this.label}</span>
        </ha-button>
      </div>
    `;
  }
}

customElements.define("sl-action-button", ActionButton);