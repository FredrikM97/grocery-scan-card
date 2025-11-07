import type { BarcodeCardConfig } from '../types';

class ShoppingListRenderer {
  async toggleItem(itemId, listManager, config, onError, onRefresh) {
    if (!listManager) return;
    try {
      const entityId = config.entity;
      await listManager.toggleComplete(itemId, entityId);
      onRefresh();
    } catch (error) {
      console.error('Failed to toggle item:', error);
      onError('Failed to update item');
    }
  }

  async removeItem(itemId, listManager, config, onError, onSuccess, onRefresh) {
    if (!listManager) return;
    try {
      const entityId = config.entity;
      await listManager.removeItem(itemId, entityId);
      onSuccess('Item removed');
      onRefresh();
    } catch (error) {
      console.error('Failed to remove item:', error);
      onError('Failed to remove item');
    }
  }

  async addQuickItem(productName, listManager, config, productLookup, onError, onSuccess, onRefresh) {
    if (!listManager || !productName) return;
    try {
      const entityId = config.entity;
      const success = await listManager.addItem(productName, entityId);
      if (success) {
        onSuccess(`Added "${productName}" to shopping list`);
        productLookup?.addToHistory(productName);
        onRefresh();
      } else {
        onError('Failed to add item to shopping list');
      }
    } catch (error) {
      console.error('Failed to add quick item:', error);
      onError('Failed to add item to shopping list');
    }
  }

  async refreshShoppingList(listManager, config, onRender, onError) {
    if (!listManager) return;
    try {
      const entityId = config.entity;
      const items = await listManager.getItems(entityId);
      const filteredItems = config.show_completed ? items : items.filter(item => !item.complete);
      onRender(filteredItems);
    } catch (error) {
      console.error('Failed to refresh shopping list:', error);
      onError('Failed to load shopping list');
    }
  }
  static renderLoading(): string {
    return `
      <div class="shopping-list">
        <div class="list-header">
          <h3>Shopping List</h3>
          <button class="refresh-btn" id="refreshBtn" title="Refresh list">
            <ha-icon icon="mdi:refresh"></ha-icon>
          </button>
        </div>
        <div class="list-items" id="shoppingList">
          <div class="list-item">
            <div class="item-content">
              <span class="loading-spinner">⟳</span>
              <span>Loading shopping list...</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  private container: HTMLElement;
  private config: BarcodeCardConfig;

  constructor(container: HTMLElement, config: BarcodeCardConfig) {
    this.container = container;
    this.config = config;
  }

  render(items: any[]): void {
    if (!items || items.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <ha-icon icon="mdi:cart-outline"></ha-icon>
          <div class="empty-state-text">Your shopping list is empty</div>
          <div class="empty-state-subtitle">Add items using the buttons above</div>
        </div>
      `;
      return;
    }

    const itemsHtml = items.map((item, index) => `
      <div class="list-item">
        <div class="item-content">
          <input 
            type="checkbox" 
            class="item-checkbox" 
            ${item.complete ? 'checked' : ''}
            data-item-id="${item.id || index}"
          >
          <span class="item-name ${item.complete ? 'completed' : ''}">${item.name}</span>
        </div>
        <div class="item-actions">
          <button class="btn btn-outline btn-sm" data-item-id="${item.id || index}" data-action="remove" title="Remove item">
            <ha-icon icon="mdi:delete"></ha-icon>
          </button>
        </div>
      </div>
    `).join('');

    this.container.innerHTML = itemsHtml;
    this._attachItemListeners();
  }

  private _attachItemListeners(): void {
    this.container.addEventListener('change', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList?.contains('item-checkbox')) {
        const itemId = (target as HTMLInputElement).dataset.itemId;
        this._dispatchEvent('toggle-item', { itemId });
      }
    });

    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const removeBtn = target.closest('[data-action="remove"]') as HTMLElement;
      if (removeBtn) {
        const itemId = removeBtn.dataset.itemId;
        this._dispatchEvent('remove-item', { itemId });
      }
    });
  }

  private _dispatchEvent(eventName: string, detail: any = {}): void {
    const event = new CustomEvent(eventName, { detail });
    this.container.dispatchEvent(event);
  }
}

export { ShoppingListRenderer };
