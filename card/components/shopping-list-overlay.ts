import { LitElement, html, css } from "lit";
import { SHOPPING_LIST_REFRESH_EVENT } from "../const";
import { customElement, property, state } from "lit/decorators.js";
import { translate } from "../translations/translations.js";
import { ShoppingListItem } from "../types.js";
import { ShoppingListStatus } from "../types.js";
import { fireEvent } from "../common.js";
import { ShoppingListService } from "../services/item-service.js";
import "./sl-dialog-overlay";

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
      ha-data-table {
        width: 100%;
        min-width: 0;
        max-width: 100%;
        flex: 1 1 auto;
        min-height: 0;
        max-height: 100%;
        overflow: auto;
      }
      .message.error-message {
        background: #ffebee;
        color: #c62828;
        padding: 6px 10px;
        border-radius: 6px;
        margin: 8px 0;
        text-align: center;
      }
      .message.success-message {
        background: #e8f5e8;
        color: #2e7d32;
        padding: 6px 10px;
        border-radius: 6px;
        margin: 8px 0;
        text-align: center;
      }
      sl-dialog-overlay::part(dialog-wrapper) {
        min-height: 600px;
        max-height: 95vh;
        min-width: 600px;
        max-width: 98vw;
      }
    `,
  ];

  private getColumns() {
    return {
      completed: {
        title: "Done",
        type: "icon-button",
        template: (row) => html`
          <span class="center-cell">
            <ha-checkbox
              .checked=${row.completed}
              @change=${(e) => {
                if (!row.completed) this._toggleItem(row.id);
              }}
              title="Mark as completed"
            ></ha-checkbox>
          </span>
        `,
      },
      name: {
        title: translate("shopping_list.item"),
        main: true,
        sortable: true,
        filterable: true,
        minWidth: "120px",
        template: (row) => html`
          <p class="ellipsis-cell">
            ${row.name}
          </p>
        `,
      },
      brand: {
        title: translate("shopping_list.brand"),
        sortable: true,
        filterable: true,
        minWidth: "120px",
        template: (row) => html`
          <p class="ellipsis-cell">
            ${row.brand && row.brand.trim() ? row.brand : '—'}
          </p>
        `,
      },
      count: {
        title: translate("shopping_list.count"),
        type: "numeric",
        sortable: true,
        minWidth: "80px",
      },
      total: {
        title: translate("shopping_list.total"),
        type: "numeric",
        sortable: true,
        minWidth: "80px",
      },
      actions: {
        title: translate("shopping_list.actions"),
        type: "icon-button",
        template: (row) => html`
          <span
            class="center-cell"
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
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  private async _loadItems() {
    if (this.listManager && this.entityId) {
      try {
        this.items = await this.listManager.getItems(this.entityId);
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
      <sl-dialog-overlay .open=${this.open}>
        <span slot="title">${translate("shopping_list.title")} (${data.length} to buy)</span>
        <span slot="header">${translate("shopping_list.subtitle") ?? ""}</span>
        <div>
          ${this.errorMessage
            ? html`<div class="message error-message">${this.errorMessage}</div>`
            : ""}
          ${this.successMessage
            ? html`<div class="message success-message">${this.successMessage}</div>`
            : ""}
          <ha-data-table
            .columns=${this.getColumns()}
            .data=${data}
            .hass=${this.hass}
            id="shopping-list-table"
            autoHeight
          ></ha-data-table>
        </div>
        <span slot="footer">
          <ha-button @click=${this.closeDialog} title="Close">${translate("shopping_list.close") ?? "Close"}</ha-button>
        </span>
      </sl-dialog-overlay>
    `;
  }
}
declare global {
  interface HTMLElementTagNameMap {
    "sl-shopping-list-overlay": ShoppingListOverlay;
  }
}
