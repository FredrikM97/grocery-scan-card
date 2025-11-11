import "./barcode-card-editor";
/**
 * Shopping List Barcode Card
 * Clean, modular implementation with separated concerns
 */
import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ProductLookup } from "./services/product-service";
import { ShoppingListService } from "./services/item-service";
import "./components/actions-panel";
import "./components/quick-chips-panel";
import "./components/scanner-overlay";
import "./components/input-panel";
import { InputPanel } from "./components/input-panel";
import "./components/shopping-list-overlay";
import type { BarcodeCardConfig, Product } from "./types";
import { loadHaComponents } from "@kipk/load-ha-components";

@customElement("barcode-card")
export class BarcodeCard extends LitElement {
  @property({ type: Object }) config?: BarcodeCardConfig;
  @state() isLoading: boolean = false;
  @state() currentProduct: Product | null = null;

  productLookup: ProductLookup | null = null;
  todoListService: ShoppingListService | null = null;

  addItemPanelRef: InputPanel | null = null;
  private _hass: any | null = null;

  static styles = css`
    .card-container {
      background: var(--card-background-color, #fff);
      border-radius: 12px;
      padding: 0;
      box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
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

  constructor() {
    super();
    this.productLookup = new ProductLookup();
    this.todoListService = new ShoppingListService(this._hass);
  }

  async connectedCallback() {
    super.connectedCallback();
    this.addEventListener("add-item", (e: CustomEvent) =>
      this._handleAddItem(e),
    );
    this.addEventListener("barcode-scanned", async (e: CustomEvent) => {
      const barcode = e.detail?.barcode;
      console.log("[BarcodeCard] barcode-scanned event:", barcode);
      if (barcode && this.addItemPanelRef) {
        const product = await this.productLookup?.getProductInfo(barcode);
        const value = product && product.name ? product.name : barcode;
        console.log("[BarcodeCard] Setting input value:", value);
        this.addItemPanelRef.setInputValue(value);
      }
    });
    this.addEventListener("shopping-list-refresh", () => {
      const shoppingListEl = this.renderRoot.querySelector("sl-shopping-list");
      if (
        shoppingListEl &&
        typeof (shoppingListEl as any).refresh === "function"
      ) {
        (shoppingListEl as any).refresh();
      }
    });
    // No longer handle show-shopping-list here; handled by overlay component
  }
  set hass(hass: any) {
    this._hass = hass;
    this.todoListService = new ShoppingListService(hass);
    this.requestUpdate();
  }

  setConfig(config: BarcodeCardConfig) {
    this.config = config;
  }

  static getConfigElement() {
    return document.createElement("barcode-card-editor");
  }

  render() {
    return html`
      <div class="card-container">
        <!-- Scanner Overlay -->
        <sl-scanner-overlay></sl-scanner-overlay>
        <!-- Actions Section -->
        <sl-actions-panel
          .disabled="${this.isLoading}"
          @scan-barcode="${() =>
            this.dispatchEvent(
              new CustomEvent("enable-scanner", {
                bubbles: true,
                composed: true,
              }),
            )}"
        ></sl-actions-panel>

        <!-- Add Item Panel (handles both manual and barcode input) -->
        <sl-input-panel
          .entityId="${this.config?.entity}"
          .todoListService="${this.todoListService}"
          ${(el) => {
            this.addItemPanelRef = el as InputPanel;
          }}
        ></sl-input-panel>

        <!-- Quick Chips Section -->
        <sl-quick-chips-panel
          .chips="${["Milk", "Bread", "Eggs", "Butter", "Cheese"]}"
          .entityId="${this.config?.entity}"
          .todoListService="${this.todoListService}"
        ></sl-quick-chips-panel>

        <!-- Shopping List Modal (handled by overlay component) -->
        <sl-shopping-list-overlay
          .listManager="${this.todoListService}"
          .entityId="${this.config?.entity}"
        ></sl-shopping-list-overlay>
      </div>
    `;
  }

  async _handleAddItem(e: CustomEvent) {
    const { productName, entityId, description } = e.detail;
    if (this.todoListService && productName && entityId) {
      await this.todoListService.addItem(productName, entityId, description);
      // Refresh the shopping list after adding
      const shoppingListEl = this.renderRoot.querySelector("sl-shopping-list");
      if (
        shoppingListEl &&
        typeof (shoppingListEl as any).refresh === "function"
      ) {
        (shoppingListEl as any).refresh();
      }
    }
  }
}
