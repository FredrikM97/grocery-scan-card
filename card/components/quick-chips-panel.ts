import { LitElement, html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { SHOPPING_LIST_REFRESH_EVENT } from "../const";
import { translate } from "../translations/translations.js";
import { ShoppingListService } from "../services/item-service.js";
import { fireEvent } from "../common.js";

/**
 * <quick-chips-renderer>
 * Encapsulates the quick add chips for barcode-card
 */
export class QuickChipsPanel extends LitElement {
  private _windowRefreshListener: EventListener;
  @property({ type: Array }) chips: string[] = [];
  @state() private _items: Array<{ name: string; total?: number }> = [];
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) entityId: string = "";
  @property({ type: Object }) todoListService: ShoppingListService = null;

  static styles = css`
    .quick-chips-section {
      margin-bottom: 16px;
      width: 100%;
    }
    .section-header {
      margin-bottom: 8px;
      text-align: center;
    }
    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      width: 100%;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._windowRefreshListener = () => this._refreshChips();
    window.addEventListener(SHOPPING_LIST_REFRESH_EVENT, this._windowRefreshListener);
    setTimeout(() => this._refreshChips(), 0);
}

  disconnectedCallback() {
  window.removeEventListener(SHOPPING_LIST_REFRESH_EVENT, this._windowRefreshListener);
  super.disconnectedCallback();
  }


  async _refreshChips() {
    if (
      this.todoListService &&
      this.entityId &&
      typeof this.todoListService.getItems === "function"
    ) {
      this._items = await this.todoListService.getItems(this.entityId);
      this.requestUpdate();
    }
  }
  private async _handleChipClick(e: Event) {
    const target = e.currentTarget as HTMLElement;
    const productName = target.getAttribute("data-product") || target.textContent || "";

    if (this.todoListService && this.entityId && productName) {
      try {
        const result = await this.todoListService.addItem(productName, this.entityId);
        // Refresh the shopping list after quick add
        const shoppingListEl = (this.getRootNode() as any).querySelector?.("sl-shopping-list");
        if (shoppingListEl && typeof (shoppingListEl as any).refresh === "function") {
          (shoppingListEl as any).refresh();
        }
        fireEvent(this, SHOPPING_LIST_REFRESH_EVENT, { item: result });
      } catch (error) {
        console.error("[QuickChipsPanel] Exception when handling quick add", {
          error,
          productName,
          entityId: this.entityId,
          todoListService: this.todoListService,
        });
      }
    } else {
      console.warn("[QuickChipsPanel] Quick add failed: missing todoListService, entityId, or productName", {
        todoListService: this.todoListService,
        entityId: this.entityId,
        productName,
      });
    }
  }

  render() {
    // Sort chips by total presses (from description) and show top 15
    let sortedChips = this.chips;
    if (this._items && this._items.length > 0) {
      sortedChips = this._items
        .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
        .slice(0, 15)
        .map((item) => item.name);
    }
    return html`
      <div class="quick-chips-section">
        <div class="section-header">
          <h3>${translate("quick_add.title") ?? "Quick Add"}</h3>
        </div>
        <div class="chips-container">
          ${sortedChips.length === 0
            ? html`<span style="color: var(--secondary-text-color, #888); font-size: 0.95em;">${translate("quick_add.empty") ?? "No quick add suggestions yet. Add items manually to build your quick add list!"}</span>`
            : sortedChips.map(
                (item) => html`
                  <ha-button
                    class="quick-chip"
                    data-product="${item}"
                    @click="${(e: Event) => this._handleChipClick(e)}"
                    ?disabled="${this.disabled}"
                  >
                    ${item}
                  </ha-button>
                `,
              )}
        </div>
      </div>
    `;
  }
}

customElements.define("sl-quick-chips-panel", QuickChipsPanel);
