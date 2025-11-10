import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { translate } from '../translations/translations.js';
import { ShoppingListItem } from '../types.js';
import { loadHaComponents } from '@kipk/load-ha-components';

/**
 * <shopping-list>
 * Self-contained shopping list component
 */
export class ShoppingListOverlay extends LitElement {
  private _globalRefreshListener = () => this._refreshShoppingList();
  @state() private open: boolean = false;
  static handleClose: number | CSSResultGroup;

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
    .shopping-list { width: 100%; box-sizing: border-box; font-family: inherit; }
    .list-header { margin-bottom: 12px; width: 100%; }
    .list-title { margin: 0; display:flex; align-items:center; justify-content:center; gap:12px; }
    .list-title-main { font-weight: 600; flex: 1; text-align:center; }
    .list-title-count { font-size:14px; font-weight:400; color:var(--primary-color,#2196f3); margin-left:8px; }

    .list-header-row { display:flex; gap:12px; align-items:center; padding:4px 0; font-weight:600; }
    .header-item { flex: 2; }
    .header-count, .header-total { flex: 1; text-align: right; }
    .header-actions { width: 40px; text-align: center; }

    .list-items { display:flex; flex-direction:column; gap:6px; }
    .list-item { display:flex; align-items:center; padding:8px 0; border-bottom: 1px solid var(--divider-color, #e0e0e0); background: var(--card-background-color, #fff); width:100%; box-sizing:border-box; }
    .item-row { display:flex; align-items:center; gap:8px; flex:2; }
    .item-count, .item-total { flex:1; text-align:right; }
    .item-actions { display:flex; align-items:center; justify-content:flex-end; width:40px; }

    .item-checkbox { width:18px; height:18px; accent-color: var(--primary-color, #2196f3); cursor:pointer; }
    .item-name { font-size:1rem; font-weight:500; color:var(--primary-text-color,#333); }
    .item-name.completed { text-decoration:line-through; opacity:0.6; color:var(--secondary-text-color,#666); }

    .btn-outline { background: var(--card-background-color, #fff); border: 1px solid var(--divider-color, #e0e0e0); color: var(--primary-color, #2196f3); padding:4px; font-size:16px; border-radius:50%; min-width:28px; min-height:28px; box-sizing:border-box; cursor:pointer; display:flex; align-items:center; justify-content:center; transition: background 0.2s, border-color 0.2s, color 0.2s; }
    .btn-outline:hover { background: var(--primary-color, #2196f3); border-color: var(--primary-color, #2196f3); color:#fff; }

    .message { padding:8px 12px; border-radius:var(--ha-card-border-radius,6px); margin:6px 0; font-size:0.95rem; text-align:center; }
    .error-message { background:#ffebee; color:#c62828; }
    .success-message { background:#e8f5e8; color:#2e7d32; }

    .sl-shopping-list-modal { padding:16px; max-width:900px; box-sizing:border-box; }
    .sl-shopping-list-modal-bg { display:flex; align-items:center; justify-content:center; }

    .modal-actions { width:100%; display:flex; justify-content:center; margin-top:24px; }
    .sl-shopping-list-modal-close { min-width:120px; }

    /* icon color in actions */
    .item-actions ha-icon { color: var(--primary-color,#2196f3); }
  `;


  async connectedCallback() {
    super.connectedCallback();
    await loadHaComponents(['ha-dialog']);
  window.addEventListener('show-shopping-list', this._handleShowShoppingList);
  window.addEventListener('shopping-list-global-refresh', this._globalRefreshListener);
  console.log('[ShoppingList] connectedCallback');
  this._refreshShoppingList();
  }

  disconnectedCallback() {
  window.removeEventListener('show-shopping-list', this._handleShowShoppingList);
  window.removeEventListener('shopping-list-global-refresh', this._globalRefreshListener);
  super.disconnectedCallback();
  }

  private _handleShowShoppingList = () => {
    this.open = true;
    this.requestUpdate();
  }

  private handleClose() {
    this.open = false;
    this.requestUpdate();
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
  window.dispatchEvent(new CustomEvent('shopping-list-global-refresh'));
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
  window.dispatchEvent(new CustomEvent('shopping-list-global-refresh'));
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
    if (!this.open) return html``;
    return html`
      <ha-dialog .open=${this.open}>
        <div class="sl-shopping-list-modal-bg">
          <div class="sl-shopping-list-modal">
            <div class="shopping-list">
              <div class="list-header">
                <h3 class="list-title">
                  <span class="list-title-main">${translate('shopping_list.title') ?? 'Shopping List'}</span>
                  <span class="list-title-count">(${this.items.filter(i => !i.completed).length} to buy)</span>
                </h3>
              </div>
              ${this.errorMessage ? html`<div class="message error-message">${this.errorMessage}</div>` : ''}
              ${this.successMessage ? html`<div class="message success-message">${this.successMessage}</div>` : ''}
              <div class="list-items">
                <div class="list-header-row">
                  <span class="header-item">Item</span>
                  <span class="header-count">Count</span>
                  <span class="header-total">Total</span>
                  <span class="header-actions"></span>
                </div>
                ${Array.isArray(this.items)
                  ? this.items.filter(item => !item.completed).map((item: ShoppingListItem) => html`
                      <div class="list-item">
                        <div class="item-row">
                          <input type="checkbox" class="item-checkbox" .checked=${item.completed} @change=${() => this._toggleItem(item.id)} ?disabled=${this.disabled}>
                          <span class="item-name ${item.completed ? 'completed' : ''}">${item.name}</span>
                        </div>
                        <div class="item-count">${item.count !== undefined ? item.count : ''}</div>
                        <div class="item-total">${item.total !== undefined ? item.total : ''}</div>
                        <div class="item-actions">
                          <button class="btn-outline" @click=${() => this._removeItem(item.id)} title="Remove item" ?disabled=${this.disabled}>
                            <ha-icon icon="mdi:delete"></ha-icon>
                          </button>
                        </div>
                      </div>
                    `)
                  : html`<div class="message">items is not an array</div>`}
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="sl-shopping-list-modal-close" @click=${this.handleClose} title="Close">Close</button>
        </div>
      </ha-dialog>
    `;
  }
}

customElements.define('sl-shopping-list-overlay', ShoppingListOverlay);
