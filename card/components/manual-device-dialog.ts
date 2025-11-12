import { LitElement, html, css } from "lit";
import { property, state } from "lit/decorators.js";
import type { ShoppingListService } from "../services/item-service";

export class ManualDeviceDialog extends LitElement {
  @property({ type: Boolean }) open = false;
  @property({ type: Object }) todoListService: ShoppingListService | null = null;
  @property({ type: String }) entityId: string = "";

  @state() name: string = "";
  @state() barcode: string = "";
  @state() brand: string = "";

  static styles = css`
    ha-dialog, dialog {
      --dialog-max-width: 480px;
      background: var(--ha-card-background, var(--card-background-color, #fff));
      color: var(--ha-card-text-color, var(--primary-text-color, #333));
      border-radius: var(--ha-card-border-radius, 12px);
      box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
      font-family: var(--ha-font-family, var(--paper-font-body1_-_font-family, system-ui));
    }
    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
    }
    input {
      font-size: 1em;
      padding: 8px;
      border-radius: var(--ha-action-border-radius, 6px);
      border: 1px solid var(--ha-primary-color, #2196f3);
      background: var(--ha-card-background, var(--card-background-color, #fff));
      color: var(--ha-card-text-color, var(--primary-text-color, #333));
    }
    
  `;

  openDialog() {
    this.open = true;
    this.requestUpdate();
  }

  closeDialog() {
    this.open = false;
    this.requestUpdate();
  }

  async _addDevice() {
    if (!this.todoListService || !this.entityId || !this.name) {
      console.error("Missing required fields");
      return;
    }
    const item = {
      name: this.name,
      barcode: this.barcode,
      brand: this.brand,
    };
  await this.todoListService.addItem(this.name, this.entityId, item);
  this.closeDialog();
  }

  render() {
    return html`
      <dialog ?open=${this.open} style="z-index:10000;">
        <h2>Add Device Manually</h2>
        <div class="dialog-content">
          <label>Name:<br /><input type="text" .value=${this.name} @input=${(e: any) => this.name = e.target.value} /></label>
          <label>Barcode:<br /><input type="text" .value=${this.barcode} @input=${(e: any) => this.barcode = e.target.value} /></label>
          <label>Brand:<br /><input type="text" .value=${this.brand} @input=${(e: any) => this.brand = e.target.value} /></label>
          <ha-button type="button" @click=${() => this._addDevice()}>
            Add Device
          </ha-button>
          <ha-button type="button" @click=${() => this.closeDialog()}>
            Cancel
          </ha-button>
        </div>
      </dialog>
    `;
  }
}

customElements.define("sl-manual-device-dialog", ManualDeviceDialog);
