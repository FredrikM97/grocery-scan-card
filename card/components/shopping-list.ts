import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { translate } from '../translations/translations.js';
import { ShoppingListItem } from '../types';

/**
 * <shopping-list>
 * Self-contained shopping list component
 */
export class ShoppingList extends LitElement {
  protected willUpdate(changedProps: Map<string, any>) {
    console.log('[ShoppingList] willUpdate', {
      changedProps: Array.from(changedProps.entries()),
      entityId: this.entityId,
      listManager: this.listManager
    });
    if (changedProps.has('entityId') || changedProps.has('listManager')) {
      this._refreshShoppingList();
    }
  }
  private _debugLog() {
    console.log('[ShoppingList DEBUG] listManager:', this.listManager);
    console.log('[ShoppingList DEBUG] entityId:', this.entityId);
    console.log('[ShoppingList DEBUG] items:', this.items);
  }
  @property({ type: Object }) listManager: any = null;
  @property({ type: String }) entityId: string = '';
  @property({ type: Boolean }) disabled = false;

  @state() private items: ShoppingListItem[] = [];
  @state() private errorMessage: string = '';
  @state() private successMessage: string = '';
  @state() private collapsed: boolean = false;

    updated(changedProps: Map<string, any>) {
      super.updated(changedProps);
      console.log('[ShoppingList] updated', {
        entityId: this.entityId,
        listManager: this.listManager,
        items: this.items,
        errorMessage: this.errorMessage,
        successMessage: this.successMessage,
        changedProps: Array.from(changedProps.entries())
      });
    }

  static styles = css`
    .shopping-list {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      width: 100%;
      box-sizing: border-box;
      .shopping-list {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        font-family: inherit;
      }
      .list-header {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        width: 100%;
      }
      .list-header h3 {
        margin: 0;
        font-size: var(--ha-card-header-font-size, 1.1rem);
        font-weight: var(--ha-card-header-font-weight, 600);
        color: var(--primary-text-color, #333);
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .collapse-icon {
        margin-left: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
      }
      .collapse-icon ha-icon {
        font-size: 20px;
        color: var(--primary-color, #2196f3);
      }
      .collapse-icon:hover ha-icon {
        color: #1769aa;
      }
      .list-items {
        border-radius: var(--ha-card-border-radius, 6px);
        border: 1px solid var(--divider-color, #e0e0e0);
        background: var(--card-background-color, #fff);
        overflow-y: auto;
        width: 100%;
        max-height: 320px;
        box-sizing: border-box;
        transition: max-height 0.2s;
        display: flex;
        flex-direction: column;
      }
      .list-header-row {
        display: flex;
        align-items: center;
        background: var(--divider-color, #f5f5f5);
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--primary-text-color, #333);
        padding: 6px 12px;
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
        border-radius: var(--ha-card-border-radius, 6px) var(--ha-card-border-radius, 6px) 0 0;
      }
      .header-item { flex: 2; }
      .header-count, .header-total { flex: 1; text-align: right; }
      .header-actions {
        width: 40px;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .list-items.collapsed {
        display: none;
      }
      .list-item {
        display: flex;
        align-items: center;
        padding: 6px 12px;
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
        background: var(--card-background-color, #fff);
        width: 100%;
        box-sizing: border-box;
      }
      .item-checkbox {
        width: 18px;
        height: 18px;
        accent-color: var(--primary-color, #2196f3);
        cursor: pointer;
      }
      .item-name {
        font-size: 1rem;
        font-weight: 500;
        color: var(--primary-text-color, #333);
        margin-left: 8px;
      }
      .item-name.completed {
        text-decoration: line-through;
        opacity: 0.6;
        color: var(--secondary-text-color, #666);
      }
      .item-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        min-width: 40px;
        margin-left: 8px;
      }
      .btn-outline {
        background: var(--card-background-color, #fff);
        border: 1px solid var(--divider-color, #e0e0e0);
        color: var(--primary-color, #2196f3);
        padding: 4px;
        font-size: 16px;
        border-radius: 50%;
        min-width: 28px;
        min-height: 28px;
        box-sizing: border-box;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        outline: none;
        transition: background 0.2s, border-color 0.2s, color 0.2s;
      }
      .btn-outline:hover {
        background: var(--primary-color, #2196f3);
        border-color: var(--primary-color, #2196f3);
        color: #fff;
      }
      .btn-outline:active {
        background: var(--primary-color-dark, #1769aa);
        border-color: var(--primary-color-dark, #1769aa);
        color: #fff;
      }
      .message {
        padding: 8px 12px;
        border-radius: var(--ha-card-border-radius, 6px);
        margin: 6px 0;
        font-size: 0.95rem;
        font-weight: 500;
        width: 100%;
        text-align: center;
      }
      .error-message {
        background: #ffebee;
        color: #c62828;
      }
      .success-message {
        background: #e8f5e8;
        color: #2e7d32;
      }
    }
    .success-message {
      background: #e8f5e8;
      color: #2e7d32;
    }
  `;


  connectedCallback() {
  super.connectedCallback();
  console.log('[ShoppingList] connectedCallback');
  this._refreshShoppingList();
  }

  public refresh() {
    console.log('[ShoppingList] refresh called');
    this._refreshShoppingList();
  }

  async _refreshShoppingList() {
    if (!this.listManager || !this.entityId) {
      console.warn('[ShoppingList] Missing listManager or entityId', { listManager: !!this.listManager, entityId: this.entityId });
      return;
    }
    try {
      console.log('[ShoppingList] Fetching items for entityId:', this.entityId);
      const items: ShoppingListItem[] = await this.listManager.getItems(this.entityId);
      console.log('[ShoppingList] getItems response:', items);
      console.log('[ShoppingList] items before assignment:', this.items);
      this.items = [...items];
      console.log('[ShoppingList] items after assignment:', this.items);
      this.requestUpdate();
    } catch (e) {
      console.error('[ShoppingList] Error fetching items:', e);
      this._showError(translate('errors.list_load_failed'));
    }
  }

  async _toggleItem(itemId: string) {
    if (!this.listManager || !this.entityId) return;
    try {
      await this.listManager.toggleComplete(itemId, this.entityId);
      await this._refreshShoppingList();
      this.dispatchEvent(new CustomEvent('shopping-list-refresh', { bubbles: true, composed: true }));
    } catch (error) {
      this._showError(translate('errors.item_update_failed'));
    }
  }

  async _removeItem(itemId: string) {
    if (!this.listManager || !this.entityId) return;
    try {
      await this.listManager.removeItem(itemId, this.entityId);
      await this._refreshShoppingList();
      this._showSuccess(translate('success.item_removed'));
      this.dispatchEvent(new CustomEvent('shopping-list-refresh', { bubbles: true, composed: true }));
    } catch (error) {
      this._showError(translate('errors.item_remove_failed'));
    }
  }

  _showError(message: string) {
    this.errorMessage = message;
    this.successMessage = '';
  }
  _showSuccess(message: string) {
    this.successMessage = message;
    this.errorMessage = '';
  }

  render() {
  console.log('[ShoppingList RENDER] items:', this.items);
  console.log('[ShoppingList RENDER] incomplete count:', this.items.filter(i => !i.completed).length);
  return html`
      <div class="shopping-list">
        <div class="list-header">
          <h3 style="width:100%;text-align:center;display:flex;align-items:center;justify-content:center;gap:12px;">
            <span style="font-weight:600;flex:1;text-align:center;">
              ${translate('shopping_list.title') ?? 'Shopping List'}
              <span style="font-size:14px;font-weight:400;color:var(--primary-color,#2196f3);margin-left:8px;">
                (${this.items.filter(i => !i.completed).length} to buy)
              </span>
            </span>
            <span class="collapse-icon" @click="${() => this.collapsed = !this.collapsed}" title="${this.collapsed ? 'Expand List' : 'Collapse List'}" style="flex-shrink:0;">
              <ha-icon icon="${this.collapsed ? 'mdi:chevron-down' : 'mdi:chevron-up'}"></ha-icon>
            </span>
          </h3>
        </div>
        ${this.errorMessage ? html`<div class="message error-message">${this.errorMessage}</div>` : ''}
        ${this.successMessage ? html`<div class="message success-message">${this.successMessage}</div>` : ''}
  <div class="list-items${this.collapsed ? ' collapsed' : ''}">
          <div class="list-header-row">
            <span class="header-item">Item</span>
            <span class="header-count">Count</span>
            <span class="header-total">Total</span>
            <span class="header-actions"></span>
          </div>
          ${Array.isArray(this.items)
            ? this.items
                .filter(item => !item.completed)
                .map((item: ShoppingListItem) => html`
                  <div class="list-item">
                    <span style="flex:2;display:flex;align-items:center;">
                      <input type="checkbox" class="item-checkbox" .checked="${item.completed}" @change="${() => this._toggleItem(item.id)}" ?disabled="${this.disabled}">
                      <span class="item-name${item.completed ? ' completed' : ''}" style="margin-left:8px;">${item.name}</span>
                    </span>
                    <span style="flex:1;text-align:right;">${item.count !== undefined ? item.count : ''}</span>
                    <span style="flex:1;text-align:right;">${item.total !== undefined ? item.total : ''}</span>
                    <span class="item-actions">
                      <button class="btn-outline" @click="${() => this._removeItem(item.id)}" title="Remove item" ?disabled="${this.disabled}">
                        <ha-icon icon="mdi:delete" style="color:var(--primary-color,#2196f3);"></ha-icon>
                      </button>
                    </span>
                  </div>
                `)
            : html`<div class="message">items is not an array</div>`}
        </div>
      </div>
    `;
  }
}

customElements.define('sl-shopping-list', ShoppingList);
