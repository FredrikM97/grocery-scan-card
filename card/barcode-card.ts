/**
 * Shopping List Barcode Card
 * Clean, modular implementation with separated concerns
 */
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BarcodeScanner } from './utils/barcode-scanner';
import { ProductLookup } from './services/product-lookup';
import { ShoppingListManager } from './services/list-manager';
import { UIManager } from './views/ui-manager';
import { translate } from './translations/translations';
import './barcode-card-editor';
import type { 
    BarcodeCardConfig, 
    Product
} from './types';

@customElement('barcode-card')
export class BarcodeCard extends LitElement {
    @property({ type: Object }) config?: BarcodeCardConfig;
    @state() isLoading: boolean = false;
    @state() showScanner: boolean = false;
    @state() currentProduct: Product | null = null;

    scanner: BarcodeScanner;
    productLookup: ProductLookup | null = null;
    listManager: ShoppingListManager | null = null;
    ui: UIManager | null = null;
    _keyHandler?: (e: KeyboardEvent) => void;
    private _hass: any | null = null;
    private _config: BarcodeCardConfig = {} as BarcodeCardConfig;

    constructor() {
        super();
        this.scanner = new BarcodeScanner();
    }
    setConfig(config) {
        this.config = config;
    }

    static getConfigElement() {
        if (typeof document !== 'undefined') {
            return document.createElement('barcode-card-editor');
        }
        return null;
    }

    _detachEventListeners() {
        this.ui?.detachEventListeners?.(this.shadowRoot, this._keyHandler);
    }

    _attachCardEventListeners() {
        this.ui?.attachCardEventListeners?.(this.shadowRoot, this);
    }

    async _lookupBarcode() {
        await this.ui?.barcodeInputRenderer?.lookupBarcode?.(
            this.productLookup,
            this.ui,
            (product) => this._handleProductFound(product),
            (barcode) => this._showManualAddOption(barcode)
        );
    }

    _handleProductFound(product: Product): void {
        this.currentProduct = product;
    this.ui?.showProductInfo?.(product);
        this._fireEvent('shopping_list_barcode_scanned', {
            barcode: product.barcode,
            product_info: product
        });
        if (this._config.auto_add) {
            this._addCurrentProduct();
        }
    }

    _showManualAddOption(barcode) {
        this.currentProduct = {
            barcode: barcode,
            name: `Product ${barcode}`,
            brand: '',
            source: 'manual'
        };
    this.ui?.showProductInfo?.(this.currentProduct);
    }

    async _addCurrentProduct() {
        if (!this.currentProduct || !this.listManager) return;
        const description = this.listManager.formatProductDescription(this.currentProduct);
        await this.ui?.addQuickItem?.(
            this.currentProduct.name,
            this.listManager,
            this._config,
            this.productLookup,
            () => {
                this.ui?.showError?.(translate('errors.add_failed'));
            },
            () => {
                this.ui?.showSuccess?.(translate('success.added_item', { name: this.currentProduct.name }));
                this._clearCurrentProduct();
                this._refreshShoppingList();
            }
        );
    }

    async _addManualItem() {
        const input = this.ui?.barcodeInputRenderer?.getBarcodeInput?.() ? this.ui.barcodeInputRenderer.getBarcodeInput().trim() : '';
        if (!input) {
            this.ui?.showError?.(translate('errors.empty_input'));
            return;
        }
        // If it looks like a barcode, try lookup first
        if (/^\d{8,13}$/.test(input)) {
            await this._lookupBarcode();
            return;
        }
        // Add as manual item
        await this.ui?.addQuickItem?.(
            input,
            this.listManager,
            this._config,
            this.productLookup,
            () => {
                this.ui?.showError?.('Failed to add item to shopping list');
            },
            () => {
                this.ui?.showSuccess?.(translate('success.added_item', { name: input }));
                this.ui?.barcodeInputRenderer?.setBarcodeInput?.('');
                this._refreshShoppingList();
            }
        );
    }

    async _startScanning() {
        await this.ui?.scannerRenderer?.startScanning?.(
            this.scanner,
            this.ui,
            this._config,
            (barcode) => this._onBarcodeScanned(barcode)
        );
    }

    _stopScanning() {
        this.ui?.scannerRenderer?.stopScanning?.(this.scanner, this.ui);
    }

    async _onBarcodeScanned(barcode) {
        this._stopScanning();
        this.ui?.barcodeInputRenderer?.setBarcodeInput?.(barcode);
        await this._lookupBarcode();
    }

    async _refreshShoppingList() {
        await this.ui?.refreshShoppingList?.(
            this.listManager,
            this._config,
            (items) => this.ui?.renderShoppingList?.(items),
            () => this.ui?.showError?.(translate('errors.list_load_failed'))
        );
    }

    async _toggleItem(itemId) {
        if (!this.listManager) return;

        try {
            const entityId = this._config.entity;
            await this.listManager.toggleComplete(itemId, entityId);
            this._refreshShoppingList();
        } catch (error) {
            console.error('Failed to toggle item:', error);
            this.ui.showError(translate('errors.item_update_failed'));
        }
    }

    async _removeItem(itemId) {
        if (!this.listManager) return;

        try {
            const entityId = this._config.entity;
            await this.listManager.removeItem(itemId, entityId);
            this._refreshShoppingList();
            this.ui.showSuccess(translate('success.item_removed'));
        } catch (error) {
            console.error('Failed to remove item:', error);
            this.ui.showError(translate('errors.item_remove_failed'));
        }
    }

    _clearCurrentProduct() {
        this.currentProduct = null;
        this.ui?.barcodeInputRenderer?.setBarcodeInput?.('');
    this.ui?.hideProductInfo?.();
    }

    async _addQuickItem(productName: string): Promise<void> {
        if (!this.listManager || !productName) return;

        try {
            const entityId = this._config.entity;
            const success = await this.listManager.addItem(productName, entityId);
            if (success) {
                this.ui?.showSuccess(`Added "${productName}" to shopping list`);
                this.productLookup?.addToHistory(productName);
                this._refreshShoppingList();
            } else {
                this.ui?.showError('Failed to add item to shopping list');
            }
        } catch (error) {
            console.error('Failed to add quick item:', error);
            this.ui?.showError('Failed to add item to shopping list');
        }
    }

    _toggleGroupsView(): void {
        // For now, just show a message that groups feature is coming soon
    this.ui?.showSuccess?.('Groups feature coming soon!');
    }

    _fireEvent(eventType: string, eventData: any): void {
        if (!this._hass) return;

        this._hass.connection.sendMessage({
            type: 'fire_event',
            event_type: eventType,
            event_data: eventData
        });
    }

    // Configuration editor methods
    static get properties() {
        return {
            hass: {},
            config: {}
        };
    }

    getCardSize() {
        return 4;
    }
}