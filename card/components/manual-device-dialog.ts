import { LitElement, html, css } from "lit";
import { property, state } from "lit/decorators.js";
import type { ShoppingListService } from "../services/item-service";
import "./sl-dialog-overlay";

export class ManualDeviceDialog extends LitElement {

  @property({ type: Object }) todoListService: ShoppingListService | null = null;
  @property({ type: String }) entityId: string = "";

  @state() open = false;
  @state() name: string = "";
  @state() barcode: string = "";
  @state() brand: string = "";

  static styles = css`
    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 18px;
      padding: 8px 0 0 0;
    }
    label {
      font-size: 1em;
      color: var(--ha-card-text-color, var(--primary-text-color, #333));
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-weight: 500;
    }
    input[type="text"] {
      font-size: 1em;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1.5px solid var(--ha-primary-color, #2196f3);
      background: var(--ha-card-background, var(--card-background-color, #fff));
      color: var(--ha-card-text-color, var(--primary-text-color, #333));
      outline: none;
      transition: border-color 0.18s;
      margin-top: 2px;
    }
    input[type="text"]:focus {
      border-color: var(--ha-secondary-color, #1976d2);
      box-shadow: 0 0 0 2px rgba(33,150,243,0.08);
    }
    ha-button {
      min-width: 100px;
    }
  `;

  openDialog() {
    this.open = true;
  }

  closeDialog() {
    this.open = false;
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
    console.log("ManualDeviceDialog render, open:", this.open);
    return html`
      <sl-dialog-overlay .open=${this.open}>
        <span slot="title">Add Device Manually</span>
        <div class="dialog-content">
          <label>Name:<br /><input type="text" .value=${this.name} @input=${(e: any) => this.name = e.target.value} /></label>
          <label>Barcode:<br /><input type="text" .value=${this.barcode} @input=${(e: any) => this.barcode = e.target.value} /></label>
          <label>Brand:<br /><input type="text" .value=${this.brand} @input=${(e: any) => this.brand = e.target.value} /></label>
        </div>
        <span slot="footer">
          <ha-button type="button" @click=${() => this._addDevice()}>
            Add Device
          </ha-button>
          <ha-button type="button" @click=${() => this.closeDialog()}>
            Cancel
          </ha-button>
        </span>
      </sl-dialog-overlay>
    `;
  }
}

customElements.define("sl-manual-device-dialog", ManualDeviceDialog);
