import "./barcode-card-editor";
/**
 * Shopping List Barcode Card
 * Clean, modular implementation with separated concerns
 */
import { LitElement, html, css } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { ProductLookup } from "./services/product-service";
import { ShoppingListService } from "./services/item-service";
import "./components/quick-chips-panel";
import "./components/action-button";
import "./components/input-panel";
import "./components/shopping-list-overlay";
import "./components/manual-device-dialog";
import "./components/scanner-overlay";
import type { BarcodeCardConfig, Product } from "./types";
import { ShoppingListOverlay } from "./components/shopping-list-overlay";
import { translate } from "./translations/translations";
import { fireEvent, HA_CARD_REQUIRED_HA_COMPONENTS } from "./common";
import { BarcodeScannerDialog } from "./components/scanner-overlay";
import { loadHaComponents } from "@kipk/load-ha-components";
import { ManualDeviceDialog } from "./components/manual-device-dialog";

@customElement("barcode-card")
export class BarcodeCard extends LitElement {
  @property({ type: Object }) config?: BarcodeCardConfig;
  productLookup: ProductLookup | null = null;
  todoListService: ShoppingListService | null = null;

  private _hass: any | null = null;

  static styles = css`
    .card-container {
      background: var(--ha-card-background, var(--card-background-color, #fff));
      border-radius: var(--ha-card-border-radius, 12px);
      padding: var(--ha-card-padding, 0);
      box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
      color: var(--ha-card-text-color, var(--primary-text-color, #333));
      font-family: var(--ha-font-family, var(--paper-font-body1_-_font-family, system-ui));
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
    }
    @media (max-width: 600px) {
      .card-container {
        padding: var(--ha-card-mobile-padding, 12px);
      }
    }
    .actions-section {
      display: flex;
      width: 100%;
      margin-top: 12px;
      margin-bottom: 8px;
      overflow: hidden;
      background: var(--ha-card-background, var(--card-background-color, #fafbfc));
      box-sizing: border-box;
    }
    .section-separator {
      width: 100%;
      height: 0;
      border-bottom: 0.5px solid var(--divider-color, #f0f1f3);
      margin-bottom: 12px;
    }
  


  `;

  constructor() {
  super();
  this.productLookup = new ProductLookup();
  // Don't initialize todoListService here, wait for hass to be set
  }

  async connectedCallback() {
    super.connectedCallback();
    await loadHaComponents(HA_CARD_REQUIRED_HA_COMPONENTS);
    // Validate todo list entity
    if (!this.config?.entity) {
      console.warn("[BarcodeCard] No todo list entity selected in config.");
    } else if (!this._hass?.states?.[this.config.entity]) {
      console.warn(`[BarcodeCard] Todo list entity '${this.config.entity}' does not exist in Home Assistant.`);
    } else {
      console.log(`[BarcodeCard] Todo list entity '${this.config.entity}' is valid and exists.`);
    }
  }
  async disconnectedCallback() {
    super.disconnectedCallback();
  }
  set hass(hass: any) {
    this._hass = hass;
    if (hass) {
      this.todoListService = new ShoppingListService(hass);
    }
  }

  setConfig(config: BarcodeCardConfig) {
    this.config = config;
  }

  static getConfigElement() {
    return document.createElement("barcode-card-editor");
  }

  private _handleShowShoppingListOverlay() {
    const query = this.shadowRoot.querySelector<ShoppingListOverlay>(
      "sl-shopping-list-overlay",
    )!;
    query?.openDialog();
  }
  private _handleShowScannerOverlay() {
    const query =
      this.shadowRoot.querySelector<BarcodeScannerDialog>("sl-scanner-overlay")!;
    query?.openDialog();
  }

  private _handleShowManualDeviceDialog() {
    const query = this.shadowRoot.querySelector<ManualDeviceDialog>("sl-manual-device-dialog")!;
    query?.openDialog();
  }

  render() {
    const serviceState = {
      hass: this._hass,
      todoListService: this.todoListService,
      entityId: this.config?.entity ?? "",
      productLookup: this.productLookup,
    };
    return html`
      <ha-card>
        <!-- Scanner Overlay -->
        <sl-scanner-overlay
          .serviceState="${serviceState}"
        ></sl-scanner-overlay>
        <!-- Manual Device Dialog -->
        <sl-manual-device-dialog
          .todoListService="${this.todoListService}"
          .entityId="${this.config?.entity}"
        ></sl-manual-device-dialog>
        <!-- Actions Section -->

        <div class="actions-section">
          <sl-action-button
            icon="mdi:camera"
            .label="${translate("actions.scan_barcode")}"
            @action-click="${this._handleShowScannerOverlay}"
          ></sl-action-button>
          <sl-action-button
           icon="mdi:plus"
            .label="${translate("actions.add_item")}" 
            @action-click="${this._handleShowManualDeviceDialog}"
          ></sl-action-button>
          <sl-action-button
            icon="mdi:format-list-bulleted"
            .label="${translate("actions.show_list")}" 
            @action-click="${this._handleShowShoppingListOverlay}"
          ></sl-action-button>
  </div>
  <div class="section-separator"></div>

        <!-- Add Item Panel (handles both manual and barcode input) -->
        <sl-input-panel
          .entityId="${this.config?.entity}"
          .todoListService="${this.todoListService}"
        ></sl-input-panel>

        <!-- Quick Chips Section -->
        <sl-quick-chips-panel
          .entityId="${this.config?.entity}"
          .todoListService="${this.todoListService}"
        ></sl-quick-chips-panel>

        <!-- Shopping List Modal (handled by overlay component) -->
        <sl-shopping-list-overlay
          .listManager="${this.todoListService}"
          .entityId="${this.config?.entity}"
          .hass="${this._hass}"
        ></sl-shopping-list-overlay>
      </ha-card>
    `;
  }
}
