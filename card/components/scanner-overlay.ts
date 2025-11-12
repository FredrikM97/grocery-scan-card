import { loadHaComponents } from "@kipk/load-ha-components";
import { LitElement, html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { fireEvent } from "../common";
import { ProductLookup } from "../services/product-service";
import { SUPPORTED_BARCODE_FORMATS } from "../const";
import "./sl-dialog-overlay";

// Add type definition if not available in DOM lib
declare global {
  interface Window {
    BarcodeDetector?: typeof BarcodeDetector;
  }

  class BarcodeDetector {
    constructor(options?: { formats?: string[] });
    detect(source: ImageBitmapSource): Promise<Array<{
      boundingBox: DOMRectReadOnly;
      rawValue: string;
      format: string;
      cornerPoints: Array<{ x: number; y: number }>;
    }>>;
    static getSupportedFormats(): Promise<string[]>;
  }
}

export class BarcodeScannerDialog extends LitElement {
  @state() open = false;
  @state() scanState = { barcode: "", format: "" };
  @state() editState = { name: "", brand: "", barcode: "" };
  @state() apiProduct = null;
  private stream: MediaStream | null = null;
  private detector: BarcodeDetector | null = null;
  
  @property({ type: Object }) serviceState = {
    hass: null,
    todoListService: null,
    entityId: "",
    productLookup: null,
  };

  static styles = css`
    video {
      width: 100%;
      border-radius: var(--ha-card-border-radius, 8px);
      background: var(--ha-card-background, var(--card-background-color, #fff));
      box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0, 0, 0, 0.08));
    }
    p {
      font-size: 1.1em;
      text-align: center;
      margin-top: 8px;
      color: var(--ha-card-text-color, var(--primary-text-color, #333));
    }
    input {
      font-size: 1em;
      padding: 8px;
      border-radius: var(--ha-action-border-radius, 6px);
      border: 1px solid var(--ha-primary-color, #2196f3);
      background: var(--ha-card-background, var(--card-background-color, #fff));
      color: var(--ha-card-text-color, var(--primary-text-color, #333));
      width: 90%;
      margin-bottom: 8px;
      box-sizing: border-box;
    }
    .button-row {
      display: flex;
      flex-direction: row;
      gap: 12px;
      margin-top: 16px;
      justify-content: center;
    }
  `;

  constructor() {
    super();
  }
  
  createEditProduct(product, barcode) {
    return {
      name: product && product.name ? product.name : "",
      brand: product && product.brand ? product.brand : "",
      barcode: product && product.barcode ? product.barcode : barcode,
    };
  }

  async updated(changed: Map<string, unknown>) {
    if (changed.has("serviceState")) {
      // Defensive: ensure required fields are present
      if (!this.serviceState.todoListService) {
        console.error('[ScannerOverlay] todoListService is null, cannot add item');
      }
      if (!this.serviceState.entityId) {
        console.error('[ScannerOverlay] entityId is null, cannot add item');
      }
      if (!this.serviceState.productLookup) {
        this.serviceState.productLookup = new ProductLookup();
      }
    }
    if (changed.has("open")) {
      if (this.open) await this.startScanner();
      else this.stopScanner();
    }
  }

  public async openDialog() {
    console.log("[ScannerOverlay] openDialog called");
    // Reset state to clear previous scan
    this.scanState = { barcode: "", format: "" };
    this.editState = { name: "", brand: "", barcode: "" };
    this.apiProduct = null;
    this.open = true;
    if (this.open) await this.startScanner();
  }


  public closeDialog() {
    console.log("[ScannerOverlay] closeDialog called");
    this.stopScanner();
    this.open = false;
  }

  async startScanner() {
    console.log("[ScannerOverlay] startScanner called");
    if (!("BarcodeDetector" in window)) {
      console.error("BarcodeDetector not supported in this browser");
      return;
    }

    await this.updateComplete; // Wait for render
    const video = this.shadowRoot!.querySelector("video") as HTMLVideoElement;
    if (!video) {
      console.error("Video element not found");
      return;
    }
    this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = this.stream;
    try {
      await video.play();
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Video play failed", err);
      }
      // Ignore AbortError, it's expected if play is interrupted
    }
    console.log("[ScannerOverlay] Video stream started");

    this.detector = new BarcodeDetector({
      formats: SUPPORTED_BARCODE_FORMATS,
    });

    const handleBarcode = async (barcode: string, format: string) => {
      this.scanState = { barcode, format };
      console.log(`[ScannerOverlay] Detected barcode: ${barcode} (format: ${format})`);
      console.log(`[ScannerOverlay] Starting product lookup for barcode: ${barcode}`);
      try {
        await this.serviceState.productLookup.lookupBarcode(
          barcode,
          (product: any) => {
            this.apiProduct = product;
            this.editState = this.createEditProduct(product, barcode);
         
          },
          (barcode: string) => {
            this.apiProduct = null;
            this.editState = this.createEditProduct(null, barcode);
          }
        );
      } catch (err) {
        console.error("Product lookup failed", err);
      }
      this.stopScanner();
    };

    const detectLoop = async () => {
      if (!this.open || !this.detector) return;
      try {
        // Only try to detect if video is ready and has a stream
        if (video.readyState < 2 || !video.srcObject) {
          requestAnimationFrame(detectLoop);
          return;
        }
        const barcodes = await this.detector.detect(video);
        if (barcodes.length === 0) {
          requestAnimationFrame(detectLoop);
          return;
        }
        const { rawValue, format } = barcodes[0];
        if (rawValue === this.scanState.barcode) {
          requestAnimationFrame(detectLoop);
          return;
        }
        await handleBarcode(rawValue, format);
        // After handling, don't continue loop (dialog closes or scanner stops)
      } catch (err) {
        console.error("Barcode detection failed", err);
        requestAnimationFrame(detectLoop);
      }
    };

    detectLoop();
  }

  private async _addToList() {
    const result = await this.serviceState.todoListService.addItem(this.editState.name, this.serviceState.entityId, this.editState);
    console.log(`[ScannerOverlay] Added to todo list:`, { product: this.editState, entityId: this.serviceState.entityId, result });
    this.closeDialog();
  }

  stopScanner() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    const video = this.shadowRoot?.querySelector("video");
    if (video) {
      video.pause();
      video.srcObject = null;
    }
  }

  render() {
    console.log("[ScannerOverlay] render called, open:", this.open);
    return html`
      <sl-dialog-overlay .open=${this.open}>
        <span slot="title">Scan a Barcode</span>
        <span slot="header">${this.scanState.barcode ? `Detected: ${this.scanState.barcode} (${this.scanState.format})` : ""}</span>
        <div>
          <video id="video" autoplay ?hidden=${!!this.scanState.barcode}></video>
          <p>
            ${this.scanState.barcode
              ? ""
              : "Point camera at barcode"}
          </p>
          ${this.scanState.barcode
            ? html`
                <div style="margin-top:16px;">
                  <label>
                    Name:<br />
                    <input
                      type="text"
                      .value=${this.editState.name}
                      @input=${(e: any) => { this.editState = { ...this.editState, name: e.target.value };  }}
                      style="width:90%;margin-bottom:8px;"
                    />
                  </label>
                  <br />
                  <label>
                    Brand:<br />
                    <input
                      type="text"
                      .value=${this.editState.brand}
                      @input=${(e: any) => { this.editState = { ...this.editState, brand: e.target.value }; }}
                      style="width:90%;margin-bottom:8px;"
                    />
                  </label>
                </div>
              `
            : ""}
        </div>
        <span slot="footer">
          ${this.scanState.barcode
            ? html`
                <ha-button type="button" @click=${() => this._addToList()}>
                  Add to List
                </ha-button>
                <ha-button type="button" @click=${() => (this.closeDialog())}>
                  Close
                </ha-button>
              `
            : html`
                <ha-button type="button" @click=${() => (this.closeDialog())}>
                  Close
                </ha-button>
              `}
        </span>
      </sl-dialog-overlay>
    `;
  }
  
}

customElements.define("sl-scanner-overlay", BarcodeScannerDialog);
