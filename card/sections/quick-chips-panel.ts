import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { translate } from '../translations/translations.js';

/**
 * <quick-chips-renderer>
 * Encapsulates the quick add chips for barcode-card
 */
export class QuickChipsPanel extends LitElement {
  @property({ type: Array }) chips: string[] = [];
  @state() private _items: Array<{ name: string; total?: number }> = [];

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('shopping-list-refresh', () => this._refreshChips());
    this._refreshChips();
  }

  async _refreshChips() {
    if (this.todoListService && this.entityId && typeof this.todoListService.getItems === 'function') {
      this._items = await this.todoListService.getItems(this.entityId);
      this.requestUpdate();
    }
  }
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) entityId: string = '';
  @property({ type: Object }) todoListService: any = null;

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
    .quick-chip {
      background: var(--primary-color, #2196f3);
      color: white;
      border: none;
      border-radius: 16px;
      padding: 8px 16px;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .quick-chip:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;

  private async _handleChipClick(e: Event) {
    const target = e.currentTarget as HTMLElement;
    const productName = target.getAttribute('data-product') || target.textContent || '';
    if (this.todoListService && this.entityId && productName) {
      try {
        await this.todoListService.addItem(productName, this.entityId);
        // Refresh the shopping list after quick add
        const shoppingListEl = (this.getRootNode() as any).querySelector?.('sl-shopping-list');
        if (shoppingListEl && typeof (shoppingListEl as any).refresh === 'function') {
          (shoppingListEl as any).refresh();
        }
        // Also refresh chips
        this._refreshChips();
        // Dispatch shopping-list-refresh event for other listeners
        this.dispatchEvent(new CustomEvent('shopping-list-refresh', { bubbles: true, composed: true }));
      } catch (error) {
        console.error('[QuickChipsPanel] Exception when handling quick add', { error, productName, entityId: this.entityId });
      }
    }
  }

  render() {
    // Sort chips by total presses (from description) and show top 15
    let sortedChips = this.chips;
    if (this._items && this._items.length > 0) {
      sortedChips = this._items
        .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
        .slice(0, 15)
        .map(item => item.name);
    }
    return html`
      <div class="quick-chips-section">
        <div class="section-header">
          <h3>${translate('quick_add.title') ?? 'Quick Add'}</h3>
        </div>
        <div class="chips-container">
          ${sortedChips.map(item => html`
            <button class="quick-chip" data-product="${item}" @click="${(e: Event) => this._handleChipClick(e)}" ?disabled="${this.disabled}">${item}</button>
          `)}
        </div>
      </div>
    `;
  }
}

customElements.define('sl-quick-chips-panel', QuickChipsPanel);
