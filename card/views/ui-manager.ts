/**
 * UI Manager Module
 * Modern, clean UI inspired by ha-shopping-list-improved
 */
import { HeaderRenderer } from './header-renderer.js';
import { BarcodeInputRenderer } from './barcode-input-renderer.js';
import { ActionsRenderer } from './actions-renderer.js';
import type { BarcodeCardConfig } from '../types.js';
import { ShoppingListRenderer } from './shopping-list-renderer';
import { QuickChipsRenderer } from './quick-chips-renderer';
import { ScannerRenderer } from './scanner-renderer';

class UIManager {
    // Attach card event listeners to shadowRoot
    attachCardEventListeners(shadowRoot: ShadowRoot, card: any): void {
        shadowRoot.addEventListener('lookup-barcode', () => card._lookupBarcode());
        shadowRoot.addEventListener('start-scan', () => card._startScanning());
        shadowRoot.addEventListener('stop-scan', () => card._stopScanning());
        shadowRoot.addEventListener('add-manual', () => card._addManualItem());
        shadowRoot.addEventListener('refresh-list', () => card._refreshShoppingList());
        shadowRoot.addEventListener('toggle-item', (e) => card._toggleItem((e as CustomEvent).detail.itemId));
        shadowRoot.addEventListener('remove-item', (e) => card._removeItem((e as CustomEvent).detail.itemId));
        shadowRoot.addEventListener('add-quick-item', (e: Event) => {
            const customEvent = e as CustomEvent;
            card._addQuickItem(customEvent.detail.productName);
        });
        shadowRoot.addEventListener('toggle-groups', () => card._toggleGroupsView());
    }

    detachEventListeners(shadowRoot: ShadowRoot, keyHandler?: (e: KeyboardEvent) => void): void {
        if (keyHandler) {
            document.removeEventListener('keydown', keyHandler);
        }
        // Optionally remove other listeners if needed
    }
    private shadow: ShadowRoot;
    private config: BarcodeCardConfig;
    private elements: Record<string, HTMLElement> = {};
    private shoppingListRenderer: ShoppingListRenderer | null = null;
    public scannerRenderer: ScannerRenderer | null = null;
    private quickChipsRenderer: QuickChipsRenderer;
    private shoppingListVisible = true;
    private isLoading = false;
    private headerRenderer: HeaderRenderer;
    public barcodeInputRenderer: BarcodeInputRenderer;
    private actionsRenderer: ActionsRenderer;

    constructor(shadowRoot: ShadowRoot, config: BarcodeCardConfig) {
        this.shadow = shadowRoot;
        this.config = config;

    // Initialize renderers
    this.headerRenderer = new HeaderRenderer(config);
    this.barcodeInputRenderer = new BarcodeInputRenderer(config);
    this.actionsRenderer = new ActionsRenderer(config);
    this.quickChipsRenderer = new QuickChipsRenderer(config);
    }

    render() {
        this.shadow.innerHTML = `
            ${this._getStyles()}
            <div class="card-container">
                ${this.headerRenderer.render()}
                ${this._renderMainActions()}
                ${this._renderInputSection()}
                ${this._renderQuickChips()}
                <button class="toggle-list-btn" id="toggleListBtn" title="Toggle shopping list">
                    <ha-icon icon="mdi:format-list-bulleted"></ha-icon>
                </button>
                <div class="shopping-list" id="shoppingList"></div>
                ${this._renderScanner()}
            </div>
        `;
        this._cacheElements();
        // Attach barcode input listeners via renderer
        const barcodeInputSection = this.shadow.getElementById('barcodeInput')?.parentElement?.parentElement;
        if (barcodeInputSection) {
            this.barcodeInputRenderer.attachListeners(barcodeInputSection);
        }
        this._attachEventListeners();
        this.shoppingListRenderer = new ShoppingListRenderer(this.elements.shoppingList, this.config);
        this.scannerRenderer = new ScannerRenderer(this.elements.barcodeScanner, this.elements.scannerVideo as HTMLVideoElement);
    }

    private _renderMainActions(): string {
        return `
            <div class="main-actions">
                <button class="action-btn scan-btn" id="scanBtn">
                    <ha-icon icon="mdi:barcode-scan"></ha-icon>
                    <span>Scan Barcode</span>
                </button>
                <button class="action-btn add-btn" id="addManualBtn">
                    <ha-icon icon="mdi:plus-circle"></ha-icon>
                    <span>Add Product</span>
                </button>
                <button class="action-btn groups-btn" id="groupsBtn">
                    <ha-icon icon="mdi:format-list-group"></ha-icon>
                    <span>Groups</span>
                </button>
            </div>
        `;
    }

    private _renderInputSection(): string {
        return `
            <div class="input-section">
                <div class="barcode-input-container">
                    <input 
                        type="text" 
                        id="barcodeInput" 
                        class="barcode-input" 
                        placeholder="Enter barcode or product name..."
                        autocomplete="off"
                    >
                    <button class="btn btn-primary" id="lookupBtn">
                        <span class="loading-spinner" style="display: none;">⟳</span>
                        <span class="btn-text">Lookup</span>
                    </button>
                </div>
                <div id="productInfo" class="product-info" style="display: none;"></div>
                <div id="errorMessage" class="message error-message" style="display: none;"></div>
                <div id="successMessage" class="message success-message" style="display: none;"></div>
            </div>
        `;
    }

    private _renderQuickChips(): string {
        return this.quickChipsRenderer.render();
    }

    private _getStyles(): string {
        return `
            <style>
                .card-container {
                    background: var(--card-background-color, #fff);
                    border-radius: 12px;
                    padding: 0;
                    box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,0.1));
                    color: var(--primary-text-color, #333);
                    font-family: var(--paper-font-body1_-_font-family, system-ui);
                    overflow: hidden;
                }

                ${this.headerRenderer.getStyles()}

                .main-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 1px;
                    background: var(--divider-color, #e0e0e0);
                    border-radius: 0;
                }

                .action-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 20px 12px;
                    background: var(--card-background-color, #fff);
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    color: var(--primary-text-color, #333);
                    font-size: 14px;
                    font-weight: 500;
                }

                .action-btn:hover {
                    background: var(--secondary-background-color, #f8f9fa);
                }

                .action-btn:active {
                    background: var(--accent-color, #e3f2fd);
                    transform: scale(0.98);
                }

                .action-btn ha-icon {
                    --mdc-icon-size: 24px;
                    margin-bottom: 8px;
                    color: var(--primary-color, #2196f3);
                }

                .scan-btn ha-icon {
                    color: var(--success-color, #4caf50);
                }

                .add-btn ha-icon {
                    color: var(--primary-color, #2196f3);
                }

                .groups-btn ha-icon {
                    color: var(--accent-color, #ff9800);
                }

                .input-section {
                    padding: 20px;
                    border-bottom: 1px solid var(--divider-color, #e0e0e0);
                }

                .barcode-input-container {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 12px;
                }

                .barcode-input {
                    flex: 1;
                    padding: 12px 16px;
                    border: 2px solid var(--divider-color, #e0e0e0);
                    border-radius: 8px;
                    font-size: 16px;
                    background: var(--card-background-color, #fff);
                    color: var(--primary-text-color, #333);
                    transition: border-color 0.2s ease;
                }

                .barcode-input:focus {
                    outline: none;
                    border-color: var(--primary-color, #2196f3);
                }

                .btn {
                    padding: 12px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .btn-primary {
                    background: var(--primary-color, #2196f3);
                    color: white;
                }

                .btn-primary:hover {
                    background: var(--primary-color-dark, #1976d2);
                    transform: translateY(-1px);
                }

                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none !important;
                }

                .loading-spinner {
                    animation: spin 1s linear infinite;
                    font-size: 16px;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .product-info {
                    background: var(--secondary-background-color, #f8f9fa);
                    border: 1px solid var(--success-color, #4caf50);
                    border-radius: 8px;
                    padding: 16px;
                    margin: 12px 0;
                }

                .product-name {
                    font-weight: 600;
                    font-size: 16px;
                    color: var(--primary-text-color, #333);
                    margin-bottom: 4px;
                }

                .product-details {
                    font-size: 14px;
                    color: var(--secondary-text-color, #666);
                }

                .message {
                    padding: 12px 16px;
                    border-radius: 8px;
                    margin: 8px 0;
                    font-size: 14px;
                    font-weight: 500;
                }

                .error-message {
                    background: var(--error-color-light, #ffebee);
                    color: var(--error-color, #f44336);
                    border-left: 4px solid var(--error-color, #f44336);
                }

                .success-message {
                    background: var(--success-color-light, #e8f5e8);
                    color: var(--success-color, #4caf50);
                    border-left: 4px solid var(--success-color, #4caf50);
                }

                .quick-chips-section {
                    padding: 20px;
                    border-bottom: 1px solid var(--divider-color, #e0e0e0);
                }

                .section-header {
                    margin-bottom: 16px;
                }

                .section-header h3 {
                    margin: 0 0 4px 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--primary-text-color, #333);
                }

                .section-subtitle {
                    font-size: 14px;
                    color: var(--secondary-text-color, #666);
                }

                .chips-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .quick-chip {
                    background: var(--secondary-background-color, #f8f9fa);
                    border: 1px solid var(--divider-color, #e0e0e0);
                    border-radius: 20px;
                    padding: 8px 16px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    color: var(--primary-text-color, #333);
                }

                .quick-chip:hover {
                    background: var(--primary-color-light, #e3f2fd);
                    border-color: var(--primary-color, #2196f3);
                    color: var(--primary-color, #2196f3);
                    transform: translateY(-1px);
                }

                .shopping-list {
                    padding: 20px;
                    background: var(--card-background-color, #fff);
                }

                .list-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .list-header h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--primary-text-color, #333);
                }

                .refresh-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--primary-color, #2196f3);
                    padding: 8px;
                    border-radius: 50%;
                    transition: background-color 0.2s ease;
                }

                .refresh-btn:hover {
                    background: var(--secondary-background-color, #f8f9fa);
                }

                .list-items {
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                    background: var(--divider-color, #e0e0e0);
                    border-radius: 8px;
                    overflow: hidden;
                }

                .list-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px;
                    background: var(--card-background-color, #fff);
                    transition: background-color 0.2s ease;
                }

                .list-item:hover {
                    background: var(--secondary-background-color, #f8f9fa);
                }

                .item-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                }

                .item-checkbox {
                    width: 20px;
                    height: 20px;
                    accent-color: var(--primary-color, #2196f3);
                    cursor: pointer;
                }

                .item-name {
                    font-size: 16px;
                    font-weight: 500;
                    color: var(--primary-text-color, #333);
                    transition: all 0.2s ease;
                }

                .item-name.completed {
                    text-decoration: line-through;
                    opacity: 0.6;
                    color: var(--secondary-text-color, #666);
                }

                .item-actions {
                    display: flex;
                    gap: 8px;
                }

                .btn-sm {
                    padding: 8px;
                    font-size: 12px;
                    border-radius: 4px;
                    min-width: auto;
                }

                .btn-outline {
                    background: transparent;
                    border: 1px solid var(--divider-color, #e0e0e0);
                    color: var(--secondary-text-color, #666);
                }

                .btn-outline:hover {
                    background: var(--error-color-light, #ffebee);
                    border-color: var(--error-color, #f44336);
                    color: var(--error-color, #f44336);
                }

                .empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: var(--secondary-text-color, #666);
                }

                .empty-state ha-icon {
                    --mdc-icon-size: 48px;
                    opacity: 0.3;
                    margin-bottom: 16px;
                }

                .empty-state-text {
                    font-size: 16px;
                    margin-bottom: 8px;
                }

                .barcode-scanner {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    display: none;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .barcode-scanner.active {
                    display: flex;
                }

                .scanner-video {
                    max-width: 90%;
                    max-height: 60%;
                    border-radius: 8px;
                }

                .scanner-controls {
                    margin-top: 20px;
                    display: flex;
                    gap: 16px;
                }

                @media (max-width: 600px) {
                    .card-container {
                        padding: 12px;
                    }
                }
            </style>
        `;
    }



    // Removed: now handled by ShoppingListRenderer.renderLoading()

    _renderScanner() {
        return this.scannerRenderer ? this.scannerRenderer.render() : '';
    }

    private _cacheElements(): void {
        this.elements = {
            scanBtn: this.shadow.getElementById('scanBtn')!,
            addManualBtn: this.shadow.getElementById('addManualBtn')!,
            groupsBtn: this.shadow.getElementById('groupsBtn')!,
            refreshBtn: this.shadow.getElementById('refreshBtn')!,
            productInfo: this.shadow.getElementById('productInfo')!,
            errorMessage: this.shadow.getElementById('errorMessage')!,
            successMessage: this.shadow.getElementById('successMessage')!,
            shoppingList: this.shadow.getElementById('shoppingList')!,
            barcodeScanner: this.shadow.getElementById('barcodeScanner')!,
            scannerVideo: this.shadow.getElementById('scannerVideo')!,
            stopScanBtn: this.shadow.getElementById('stopScanBtn')!,
        };
    }

    private _attachEventListeners(): void {
        // Barcode input key event handled by BarcodeInputRenderer

        // Main action buttons
        this.elements.scanBtn?.addEventListener('click', () => {
            this._dispatchEvent('start-scan');
        });

        this.elements.addManualBtn?.addEventListener('click', () => {
            this._dispatchEvent('add-manual');
        });

        this.elements.groupsBtn?.addEventListener('click', () => {
            this._dispatchEvent('toggle-groups');
        });

        // Input section buttons: now handled by BarcodeInputRenderer

        this.elements.refreshBtn?.addEventListener('click', () => {
            this._dispatchEvent('refresh-list');
        });

        this.elements.stopScanBtn?.addEventListener('click', () => {
            this._dispatchEvent('stop-scan');
        });

        // Quick chips click logic should be handled by QuickChipsRenderer
    }

    private _dispatchEvent(eventName: string, detail: any = {}): void {
        const event = new CustomEvent(eventName, { detail });
        this.shadow.dispatchEvent(event);
    }


    setLoading(isLoading: boolean, buttonId = 'lookupBtn'): void {
        this.isLoading = isLoading;
        const button = this.elements[buttonId] as HTMLButtonElement;
        if (!button) return;

        const spinner = button.querySelector('.loading-spinner') as HTMLElement;
        const text = button.querySelector('.btn-text') as HTMLElement;

        if (isLoading) {
            button.disabled = true;
            if (spinner) spinner.style.display = 'inline-block';
            if (text) text.textContent = 'Loading...';
        } else {
            button.disabled = false;
            if (spinner) spinner.style.display = 'none';
            if (text) text.textContent = 'Lookup';
        }
    }

    // Public UI feedback and shopping list methods for BarcodeCard
    showError(message: string): void {
        if (this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
            this.elements.errorMessage.style.display = 'block';
        }
        if (this.elements.successMessage) {
            this.elements.successMessage.style.display = 'none';
        }
    }

    showSuccess(message: string): void {
        if (this.elements.successMessage) {
            this.elements.successMessage.textContent = message;
            this.elements.successMessage.style.display = 'block';
        }
        if (this.elements.errorMessage) {
            this.elements.errorMessage.style.display = 'none';
        }
    }

    showProductInfo(product: any): void {
        if (this.elements.productInfo) {
            this.elements.productInfo.innerHTML = `
                <div class="product-name">${product.name}</div>
                <div class="product-details">${product.brand ? product.brand + ' | ' : ''}${product.barcode}</div>
            `;
            this.elements.productInfo.style.display = 'block';
        }
    }

    hideProductInfo(): void {
        if (this.elements.productInfo) {
            this.elements.productInfo.style.display = 'none';
        }
    }

    addQuickItem(productName, listManager, config, productLookup, onError, onSuccess): Promise<void> {
        return this.shoppingListRenderer?.addQuickItem?.(
            productName,
            listManager,
            config,
            productLookup,
            onError,
            onSuccess,
            () => {}
        ) ?? Promise.resolve();
    }

    refreshShoppingList(listManager, config, onRender, onError): Promise<void> {
        return this.shoppingListRenderer?.refreshShoppingList?.(
            listManager,
            config,
            onRender,
            onError
        ) ?? Promise.resolve();
    }

    renderShoppingList(items: any[]): void {
        this.shoppingListRenderer?.render?.(items);
    }
}

export { UIManager };
