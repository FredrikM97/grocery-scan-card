import { LitElement, html, css } from "lit";
import { property } from "lit/decorators.js";

/**
 * ActionButton - reusable button for actions in barcode-card
 * Usage:
 * <action-button icon="mdi:camera" label="Scan" @click="..." />
 */
export class ActionButton extends LitElement {
  @property({ type: String }) icon = "";
  @property({ type: String }) label = "";
  @property({ type: Boolean }) outlined = false;
  @property({ type: Boolean }) disabled = false;

  static styles = css`
    button {
      width: 100%;
      box-sizing: border-box;
      padding: 12px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      background: var(--primary-color, #2196f3);
      color: white;
      transition: background 0.2s ease;
    }
    button.outlined {
      background: transparent;
      color: var(--primary-color, #2196f3);
      border: 1px solid var(--primary-color, #2196f3);
    }
    button:hover {
      background: var(--primary-color-hover, #1976d2);
      color: #fff;
      filter: brightness(1.1);
    }
    ha-icon {
      --mdc-icon-size: 20px;
    }
  `;

  render() {
    return html`
      <button
        class="${this.outlined ? "outlined" : ""}"
        ?disabled="${this.disabled}"
        @click="${(e: Event) =>
          this.dispatchEvent(new CustomEvent("action-click", { detail: e }))}"
      >
        <ha-icon icon="${this.icon}"></ha-icon>
        <span>${this.label}</span>
      </button>
    `;
  }
}

customElements.define("sl-action-button", ActionButton);
