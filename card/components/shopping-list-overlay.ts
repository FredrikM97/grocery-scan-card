import { LitElement, html, css } from "lit";
import { SHOPPING_LIST_REFRESH_EVENT } from "../const";
import { customElement, property, state } from "lit/decorators.js";
import { translate } from "../translations/translations.js";
import { ShoppingListItem } from "../types.js";
import { ShoppingListStatus } from "../types.js";
import { fireEvent } from "../common.js";
import { ShoppingListService } from "../services/item-service.js";

@customElement("sl-shopping-list-overlay")
export class ShoppingListOverlay extends LitElement {
  @property({ type: Object }) listManager: ShoppingListService = null;
  @property({ type: String }) entityId: string = "";
  @property({ type: Object }) hass: any = null;

  @state() private open = false;
  @state() private items: ShoppingListItem[] = [];
  @state() private errorMessage: string = "";
  @state() private successMessage: string = "";

  static styles = [
    css`
      .dialog-header {
        text-align: center;
        margin: 16px 0 8px 0;
      }
    `,
  ];

  private getColumns() {
    return {
      completed: {
        title: "Done",
        type: "icon-button",
        template: (row) => html`
          <ha-checkbox
            .checked=${row.completed}
            @change=${(e) => {
              if (!row.completed) this._toggleItem(row.id);
            }}
            title="Mark as completed"
          ></ha-checkbox>
        `,
      },
      name: {
        title: translate("shopping_list.item"),
        main: true,
        sortable: true,
        filterable: true,
      },
      brand: {
        title: translate("shopping_list.brand") || "Brand",
        sortable: true,
        filterable: true,
      },
      count: {
        title: translate("shopping_list.count"),
        type: "numeric",
        sortable: true,
      },
      total: {
        title: translate("shopping_list.total"),
        type: "numeric",
        sortable: true,
      },
      actions: {
        title: translate("shopping_list.actions"),
        type: "icon",
        template: (row) => html`
          <span
            style="display: flex; align-items: center; cursor: pointer;"
            @click=${(e) => { this._removeItem(row.id); }}
            title="Delete item"
          >
            <ha-icon icon="mdi:delete"></ha-icon>
          </span>
        `,
      },
    };
  }

  public openDialog() {
  this.open = true;
  this._loadItems();
  }

  public closeDialog() {
    this.open = false;
    this.requestUpdate();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  private async _loadItems() {
    if (this.listManager && this.entityId) {
      try {
        this.items = await this.listManager.getItems(this.entityId);
        this.requestUpdate();
      } catch (error) {
        this._showError("Failed to load shopping list items");
      }
    }
  }

  async _toggleItem(itemId: string) {
    try {
      await this.listManager.toggleComplete(itemId, this.entityId);
      await this._loadItems();
      fireEvent(this, SHOPPING_LIST_REFRESH_EVENT);
    } catch (error) {
      this._showError(translate("errors.item_update_failed"));
    }
  }

  async _removeItem(itemId: string) {
    console.log('[ShoppingListOverlay] _removeItem called for', itemId);
    try {
      await this.listManager.removeItem(itemId, this.entityId);
      await this._loadItems();
      fireEvent(this, SHOPPING_LIST_REFRESH_EVENT);
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
    console.log("[ShoppingListOverlay] render called, open:", this.open);
    if (!this.open) {
      return html``;
    }
    const data = Array.isArray(this.items)
      ? this.items.filter((item) => item && item.status === ShoppingListStatus.NeedsAction)
      : [];
    return html`
      <ha-dialog .open=${this.open}>
      <h3 class="dialog-header">
        ${translate("shopping_list.title") ?? "Shopping List"}
        <span class="dialog-header-count">(${data.length} to buy)</span>
      </h3>
      ${this.errorMessage
        ? html`<div
            class="message error-message"
            style="background:#ffebee; color:#c62828;"
          >
            ${this.errorMessage}
          </div>`
        : ""}
      ${this.successMessage
        ? html`<div
            class="message success-message"
            style="background:#e8f5e8; color:#2e7d32;"
          >
            ${this.successMessage}
          </div>`
        : ""}
      <ha-data-table
        .columns=${this.getColumns()}
        .data=${data}
        .hass=${this.hass}
        id="shopping-list-table"
        autoHeight
      ></ha-data-table>
      <div slot="primaryAction">
        <ha-button @click=${this.closeDialog} title="Close">Close</ha-button>
      </div>
      </ha-dialog>
    `;
  }
}
declare global {
  interface HTMLElementTagNameMap {
    "sl-shopping-list-overlay": ShoppingListOverlay;
  }
}
