import { LitElement, html, css } from "lit";
import { SHOPPING_LIST_REFRESH_EVENT } from "../const";
import { property, state } from "lit/decorators.js";
import { translate } from "../translations/translations.js";
import { ShoppingListItem } from "../types.js";
// Minimal fireEvent utility for custom events
function fireEvent(node: HTMLElement, type: string, detail?: any) {
  const event = new CustomEvent(type, {
    detail,
    bubbles: true,
    composed: true,
  });
  node.dispatchEvent(event);
}
import { loadHaComponents } from "@kipk/load-ha-components";

export class ShoppingListOverlay extends LitElement {
  private getColumns() {
    return [
      {
        name: "name",
        title: translate("shopping_list.item") ?? "Item",
      },
      {
        name: "count",
        title: translate("shopping_list.count") ?? "Count",
      },
      {
        name: "total",
        title: translate("shopping_list.total") ?? "Total",
      },
      {
        name: "actions",
        title: translate("shopping_list.actions") ?? "",
      },
    ];
  }
  public showDialog(params: { entityId?: string; listManager?: any }) {
    if (params.entityId) this.entityId = params.entityId;
    if (params.listManager) this.listManager = params.listManager;
    this.open = true;
    this.requestUpdate();
  }

  public closeDialog() {
  this.open = false;
  this.requestUpdate();
  fireEvent(this, "dialog-closed", { dialog: this.localName });
  }
  // ...existing code...
  @state() private newItemName: string = "";

  private async _addItem() {
    if (!this.listManager || !this.entityId || !this.newItemName.trim()) return;
    try {
      await this.listManager.addItem(this.newItemName.trim(), this.entityId);
      this.newItemName = "";
      await this._refreshShoppingList();
      this._showSuccess(translate("success.item_added") ?? "Item added");
    } catch (error) {
      this._showError(translate("errors.item_add_failed") ?? "Failed to add item");
    }
  }
  @state() private open: boolean = false;

  @property({ type: Object }) listManager: any = null;
  @property({ type: String }) entityId: string = "";
  @property({ type: Object }) hass: any = null;

  @state() private items: ShoppingListItem[] = [];
  @state() private errorMessage: string = "";
  @state() private successMessage: string = "";

  static styles = [
    css`
      .shopping-list-table {
        width: 100%;
        box-sizing: border-box;
      }
      .message {
        margin: 8px 0;
        text-align: center;
      }
      .dialog-header {
        text-align: center;
        margin: 16px 0 8px 0;
      }
    `,
  ];
  updated(changedProps: Map<string, any>) {
    super.updated(changedProps);
  }

  async connectedCallback() {
    super.connectedCallback();
    await loadHaComponents(["ha-dialog", "ha-data-table"]);
    this._refreshShoppingList();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }


  async _refreshShoppingList() {
    if (!this.listManager || !this.entityId) {
      return;
    }
    try {
      const items: ShoppingListItem[] = await this.listManager.getItems(
        this.entityId,
      );
      this.items = [...items];
      this.requestUpdate();
    } catch (e) {
      this._showError(translate("errors.list_load_failed"));
    }
  }

  async _toggleItem(itemId: string) {
    if (!this.listManager || !this.entityId) return;
    try {
      await this.listManager.toggleComplete(itemId, this.entityId);
      await this._refreshShoppingList();
      fireEvent(this, SHOPPING_LIST_REFRESH_EVENT);
    } catch (error) {
      this._showError(translate("errors.item_update_failed"));
    }
  }

  async _removeItem(itemId: string) {
    if (!this.listManager || !this.entityId) return;
    try {
      await this.listManager.removeItem(itemId, this.entityId);
      await this._refreshShoppingList();
      this._showSuccess(translate("success.item_removed"));
      fireEvent(this, "shopping-list-global-refresh");
    } catch (error) {
      this._showError(translate("errors.item_remove_failed"));
    }
  }

  _showError(message: string) {
    this.errorMessage = message;
    this.successMessage = "";
  }
  _showSuccess(message: string) {
    this.successMessage = message;
    this.errorMessage = "";
  }

  render() {
    if (!this.open) return html``;
    // Only show items that are not completed
    const data = Array.isArray(this.items)
      ? this.items.filter((item) => !item.completed)
      : [];
    return html`
      <ha-dialog .open=${this.open}>
        <h3 class="dialog-header">
          ${translate("shopping_list.title") ?? "Shopping List"}
          <span class="dialog-header-count">(${data.length} to buy)</span>
        </h3>
        ${this.errorMessage
          ? html`<div class="message error-message" style="background:#ffebee; color:#c62828;">${this.errorMessage}</div>`
          : ""}
        ${this.successMessage
          ? html`<div class="message success-message" style="background:#e8f5e8; color:#2e7d32;">${this.successMessage}</div>`
          : ""}
        <ha-data-table
          .columns=${this.getColumns()}
          .data=${data}
          .hass=${this.hass}
          id="shopping-list-table"
          autoHeight
        ></ha-data-table>

        <ha-button @click=${this.closeDialog()} title="Close">Close</ha-button>

      </ha-dialog>
    `;
  }
}
customElements.define("sl-shopping-list-overlay", ShoppingListOverlay);
