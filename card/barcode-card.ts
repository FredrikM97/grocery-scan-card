import './barcode-card-editor';
/**
 * Shopping List Barcode Card
 * Clean, modular implementation with separated concerns
 */
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ProductLookup } from './services/product-lookup';
import { ShoppingListService } from './services/shopping-list-service';
import './sections/actions-section';
import './sections/quick-chips-panel';
import './components/scanner-overlay';
import './sections/add-item-panel';
import { AddItemPanel } from './sections/add-item-panel';
import './components/shopping-list';
import type { BarcodeCardConfig, Product } from './types';

@customElement('barcode-card')
export class BarcodeCard extends LitElement {
    @state() private showShoppingListModal: boolean = false;
    _openShoppingListModal() {
        this.showShoppingListModal = true;
    }

    _closeShoppingListModal() {
        this.showShoppingListModal = false;
    }

    _renderShoppingListModal() {
        if (!this.showShoppingListModal) return html``;
        return html`
            <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);z-index:9999;display:flex;align-items:center;justify-content:center;">
                <div style="background:#fff;border-radius:12px;box-shadow:0 2px 16px rgba(0,0,0,0.2);padding:24px;min-width:340px;max-width:96vw;max-height:90vh;overflow:auto;position:relative;">
                    <button @click="${() => this._closeShoppingListModal()}" style="position:absolute;top:12px;right:12px;background:transparent;border:none;font-size:1.5rem;cursor:pointer;">&times;</button>
                    <sl-shopping-list
                        .listManager="${this.todoListService}"
                        .entityId="${this.config?.entity}"
                    ></sl-shopping-list>
                </div>
            </div>
        `;
    }
    addItemPanelRef: AddItemPanel | null = null;

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('add-item', (e: CustomEvent) => this._handleAddItem(e));
        this.addEventListener('barcode-scanned', async (e: CustomEvent) => {
            const barcode = e.detail?.barcode;
            console.log('[BarcodeCard] barcode-scanned event:', barcode);
            if (barcode && this.addItemPanelRef) {
                const product = await this.productLookup?.getProductInfo(barcode);
                const value = (product && product.name) ? product.name : barcode;
                console.log('[BarcodeCard] Setting input value:', value);
                this.addItemPanelRef.setInputValue(value);
            }
        });
        this.addEventListener('shopping-list-refresh', () => {
            const shoppingListEl = this.renderRoot.querySelector('sl-shopping-list');
            if (shoppingListEl && typeof (shoppingListEl as any).refresh === 'function') {
                (shoppingListEl as any).refresh();
            }
        });
        this.addEventListener('show-shopping-list', () => {
            this._openShoppingListModal();
        });
    }
    set hass(hass: any) {
        this._hass = hass;
        this.todoListService = new ShoppingListService(hass);
        this.requestUpdate();
    }
    

    static styles = css`
        .card-container {
            background: var(--card-background-color, #fff);
            border-radius: 12px;
            padding: 0;
            box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,0.1));
            color: var(--primary-text-color, #333);
            font-family: var(--paper-font-body1_-_font-family, system-ui);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            justify-content: flex-start;
        }
        @media (max-width: 600px) {
            .card-container {
                padding: 12px;
            }
        }
    `;

    
    @property({ type: Object }) config?: BarcodeCardConfig;
    @state() isLoading: boolean = false;
    @state() currentProduct: Product | null = null;

    productLookup: ProductLookup | null = null;
    todoListService: ShoppingListService | null = null;
    private _hass: any | null = null;

    constructor() {
        super();
        this.productLookup = new ProductLookup();
    this.todoListService = new ShoppingListService(this._hass);
    }

    setConfig(config: BarcodeCardConfig) {
        this.config = config;
    }

    static getConfigElement() {
        return document.createElement('barcode-card-editor');
    }

    render() {
        return html`
            <div class="card-container">
                <!-- Card Header with Show Shopping List Button -->
                <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 12px 0 12px;">
                    <span style="font-size:1.2rem;font-weight:600;">Shopping List Card</span>
                    <button @click="${() => this._openShoppingListModal()}" style="background:var(--primary-color,#2196f3);color:#fff;border:none;border-radius:6px;padding:8px 16px;cursor:pointer;font-size:1rem;">Show Shopping List</button>
                </div>
                <!-- Scanner Overlay -->
                <sl-scanner-overlay></sl-scanner-overlay>
                <!-- Actions Section -->
                <sl-actions-section
                    .disabled="${this.isLoading}"
                    @scan-barcode="${() => this.dispatchEvent(new CustomEvent('enable-scanner', { bubbles: true, composed: true }))}"
                ></sl-actions-section>

                <!-- Add Item Panel (handles both manual and barcode input) -->
                <sl-add-item-panel
                    .entityId="${this.config?.entity}"
                    .todoListService="${this.todoListService}"
                    ${el => { this.addItemPanelRef = el as AddItemPanel; }}
                ></sl-add-item-panel>

                <!-- Quick Chips Section -->
                <sl-quick-chips-panel
                    .chips="${['Milk', 'Bread', 'Eggs', 'Butter', 'Cheese']}"
                    .entityId="${this.config?.entity}"
                    .todoListService="${this.todoListService}"
                ></sl-quick-chips-panel>

                <!-- Shopping List Modal (to be implemented) -->
                ${this._renderShoppingListModal()}
            </div>
        `;
    }

    async _handleAddItem(e: CustomEvent) {
        const { productName, entityId, description } = e.detail;
        if (this.todoListService && productName && entityId) {
            await this.todoListService.addItem(productName, entityId, description);
            // Refresh the shopping list after adding
            const shoppingListEl = this.renderRoot.querySelector('sl-shopping-list');
            if (shoppingListEl && typeof (shoppingListEl as any).refresh === 'function') {
                (shoppingListEl as any).refresh();
            }
        }
    }
    }
