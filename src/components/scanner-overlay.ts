import { LitElement, html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { BannerMessage } from "../types";
import "./message-banner";
import { ProductLookup } from "../services/product-service";
import { TodoService } from "../services/todo-service";
import { SUPPORTED_BARCODE_FORMATS } from "../const";
import { BrowserMultiFormatReader } from "@zxing/browser";
import NotFoundException from "@zxing/library/esm/core/NotFoundException";
import "./dialog-overlay";

// Add type definition if not available in DOM lib
declare global {
  interface Window {
    BarcodeDetector?: typeof BarcodeDetector;
  }

  class BarcodeDetector {
    constructor(options?: { formats?: string[] });
    detect(source: ImageBitmapSource): Promise<
      Array<{
        boundingBox: DOMRectReadOnly;
        rawValue: string;
        format: string;
        cornerPoints: Array<{ x: number; y: number }>;
      }>
    >;
    static getSupportedFormats(): Promise<string[]>;
  }
}

export class BarcodeScannerDialog extends LitElement {
  private video: HTMLVideoElement | null = null;
  private detector: BarcodeDetector | null = null;
  private zxingReader: BrowserMultiFormatReader | null = null;
  @state() open = false;
  @state() scanState = { barcode: "", format: "" };
  @state() editState = { name: "", brand: "", barcode: "" };
  @state() apiProduct = null;
  @state() banner: BannerMessage | null = null;
  @state() availableCameras: MediaDeviceInfo[] = [];
  @state() selectedCameraId: string | null = null;

  @property({ type: Object }) serviceState: {
    hass: any;
    todoListService: TodoService | null;
    entityId: string;
    productLookup: ProductLookup | null;
  } = {
    hass: null,
    todoListService: null,
    entityId: "",
    productLookup: null,
  };

  static styles = css`
    :host {
      display: block;
      background: var(--ha-card-background, var(--card-background-color, #222));
      color: var(--ha-card-text-color, var(--primary-text-color, #fff));
      border-radius: var(--ha-card-border-radius, 8px);
      box-shadow: var(--ha-card-box-shadow, 0 2px 6px rgba(0, 0, 0, 0.15));
      min-height: 100%;
    }
    .video-container {
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: auto;
      margin-right: auto;
      background: inherit;
    }
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: var(--ha-card-border-radius, 8px);
      display: block;
      background: var(--ha-card-background, var(--card-background-color, #222));
    }
    .button-row {
      display: flex;
      flex-direction: row;
      gap: 12px;
      margin-top: 16px;
      justify-content: center;
    }
    .camera-select {
      margin-right: 8px;
      min-width: 120px;
      max-width: 180px;
      font-size: 0.95em;
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid var(--ha-primary-color, #2196f3);
      background: var(--ha-card-background, var(--card-background-color, #222));
      color: var(--ha-card-text-color, var(--primary-text-color, #fff));
    }
    .scanner-inputs {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 18px 0 0 0;
      align-items: stretch;
    }
    .scanner-inputs ha-textfield {
      width: 100%;
      box-sizing: border-box;
    }
    .scanner-inputs label {
      font-size: 1em;
      color: var(--ha-card-text-color, var(--primary-text-color, #fff));
      font-weight: 500;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .scanner-inputs input[type="text"] {
      font-size: 1em;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1.5px solid var(--ha-primary-color, #2196f3);
      background: var(--ha-card-background, var(--card-background-color, #222));
      color: var(--ha-card-text-color, var(--primary-text-color, #fff));
      outline: none;
      transition: border-color 0.18s;
      margin-top: 2px;
    }
    .scanner-inputs input[type="text"]:focus {
      border-color: var(--ha-secondary-color, #1976d2);
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.08);
    }
  `;

  constructor() {
    super();
    this._onBarcodeScanned = this._onBarcodeScanned.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("barcode-scanned", this._onBarcodeScanned);
  }

  disconnectedCallback() {
    window.removeEventListener("barcode-scanned", this._onBarcodeScanned);
    super.disconnectedCallback();
  }

  private async _onBarcodeScanned(ev: Event) {
    const detail = (ev as CustomEvent).detail;
    if (detail && detail.result) {
      // Home Assistant app returns just the barcode string, no format
      await this.handleBarcode(detail.result, "native");
    } else {
      this.banner = BannerMessage.error("No barcode found by app scanner.");
    }
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
      if (!this.serviceState.productLookup) {
        this.serviceState.productLookup = new ProductLookup();
      }
    }
    if (changed.has("open")) {
      if (this.open) {
        await this.getListOfCameras();
        await this.startScanner();
      } else {
        await this.stopScanner();
      }
    }
  }

  async getListOfCameras() {
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.enumerateDevices !== "function") {
      this.availableCameras = [];
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.availableCameras = devices.filter((device) => device.kind === "videoinput");
      if (!this.selectedCameraId && this.availableCameras.length > 0) {
        this.selectedCameraId = this.availableCameras[0].deviceId;
      }
    } catch (e) {
      this.availableCameras = [];
    }
  }

  private pickCameraDevice(deviceId: string) {
    this.selectedCameraId = deviceId;
    this.stopScanner();
    this.startScanner();
  }

  public async openDialog() {
    // Reset state to clear previous scan
    this.scanState = { barcode: "", format: "" };
    this.editState = { name: "", brand: "", barcode: "" };
    this.apiProduct = null;
    this.open = true;
    if (this.open) await this.startScanner();
  }

  public closeDialog() {
    this.stopScanner();
    this.open = false;
    this.banner = null;
  }

  async startScanner() {
    // Clear error if camera is available
    if (this.banner) {
      this.banner = null;
    }
    await this.updateComplete;
    this.video = this.shadowRoot!.querySelector("video") as HTMLVideoElement;
    if (!this.video) {
      this.banner = BannerMessage.error("Video element not found");
      return;
    }
    // Robust check for camera API support
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
      this.banner = BannerMessage.error(
        "Camera access is not supported in this environment. Please use a browser that supports camera access."
      );
      return;
    }
    let videoConstraints: any = { facingMode: "environment" };
    if (this.selectedCameraId) {
      videoConstraints = { deviceId: { exact: this.selectedCameraId } };
    }
    try {
      this.video.srcObject = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });
    } catch (err: any) {
      if (
        err &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")
      ) {
        this.banner = BannerMessage.error(
          "Camera permission denied. Please allow camera access in your browser or app settings.",
        );
      } else {
        this.banner = BannerMessage.error(
          "Camera access failed: " + (err?.message || err),
        );
      }
      return;
    }
    try {
      await this.video.play();
    } catch (err: any) {
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        this.banner = BannerMessage.error(
          "Camera permission denied. Please allow camera access in your browser or app settings.",
        );
        return;
      }
      if (err.name !== "AbortError") {
        this.banner = BannerMessage.error(
          "Video play failed: " + (err?.message || err),
        );
        return;
      }
    }
    if ("BarcodeDetector" in window) {
      try {
        this.detector = new BarcodeDetector({
          formats: SUPPORTED_BARCODE_FORMATS,
        });
      } catch (err) {
        this.banner = BannerMessage.error(
          "BarcodeDetector init failed: " + (err?.message || err),
        );
        return;
      }
      this.detectLoop();
    } else {
      // Fallback to @zxing/browser
      try {
        this.zxingReader = new BrowserMultiFormatReader();
      } catch (err) {
        this.banner = BannerMessage.error(
          "Barcode scanning not supported: " + (err?.message || err),
        );
        return;
      }
      this.detectLoopZXing();
    }
  }

  private async handleBarcode(barcode: string, format: string) {
    if (await this._handleExistingBarcode(barcode)) {
      return;
    }

    // Only update scanState if not an existing item
    this.scanState = { barcode, format };
    try {
      await this.serviceState.productLookup.lookupBarcode(
        barcode,
        (product: any) => {
          this.apiProduct = product;
          this.editState = this.createEditProduct(product, barcode);
        },
        () => {
          this.apiProduct = null;
          this.editState = this.createEditProduct(null, barcode);
        },
      );
    } catch (err) {
      this.banner = BannerMessage.error(
        "Product lookup failed: " + (err?.message || err),
      );
    }
    this.stopScanner();
  }

  /**
   * Checks if the barcode already exists in the todo list and handles incrementing if so.
   * Returns true if the barcode was handled (existing), false otherwise.
   */
  private async _handleExistingBarcode(barcode: string): Promise<boolean> {
    const items =
      (await this.serviceState.todoListService.getItems(
        this.serviceState.entityId,
      )) || [];
    if (Array.isArray(items)) {
      const existing = items.find((item: any) => item.barcode === barcode);
      if (existing) {
        // Assign name, brand, and entityId from the existing item before incrementing
        this.editState = {
          name: existing.name,
          brand: existing.brand || "",
          barcode: existing.barcode,
        };
        console.log(
          "[ScannerOverlay] Existing barcode found, incrementing item:",
          existing,
        );
        await this._addToList();
        return true;
      }
    }
    return false;
  }

  private detectLoop = async () => {
    if (!this.open) return;
    if (this.detector) {
      try {
        if (this.video.readyState < 2 || !this.video.srcObject) {
          requestAnimationFrame(this.detectLoop);
          return;
        }
        const barcodes = await this.detector.detect(this.video);
        if (!barcodes.length) {
          requestAnimationFrame(this.detectLoop);
          return;
        }
        const { rawValue, format } = barcodes[0];
        if (rawValue === this.scanState.barcode) {
          requestAnimationFrame(this.detectLoop);
          return;
        }
        await this.handleBarcode(rawValue, format);
      } catch (err) {
        this.banner = BannerMessage.error(
          "Barcode detection failed: " + (err?.message || err),
        );
        requestAnimationFrame(this.detectLoop);
      }
    }
  };

  private detectLoopZXing = async () => {
    if (!this.open || !this.zxingReader || !this.video) return;
    try {
      const result = await this.zxingReader.decodeOnceFromVideoElement(this.video);
      if (result && result.getText()) {
        await this.handleBarcode(result.getText(), result.getBarcodeFormat());
        return;
      }
    } catch (err: any) {
      if (err instanceof NotFoundException) {
        // No barcode found, keep scanning
        if (this.open) {
          setTimeout(this.detectLoopZXing, 200);
        }
        return;
      } else {
        this.banner = BannerMessage.error(
          "Barcode detection failed: " + (err?.message || err),
        );
        return;
      }
    }
    if (this.open) {
      setTimeout(this.detectLoopZXing, 200);
    }
  };

  private async _addToList() {
    if (!this.editState.name || !this.editState.brand) {
      this.banner = BannerMessage.error("Name and brand are required.");
      return;
    }
    if (!this.serviceState.todoListService || !this.serviceState.entityId) {
      this.banner = BannerMessage.error("Service or entity ID missing.");
      return;
    }
    try {
      const result = await this.serviceState.todoListService.addItem(
        this.editState.name,
        this.serviceState.entityId,
        this.editState,
      );
      // Item added to todo list
      this.closeDialog();
    } catch (e: any) {
      const msg = e?.message || "Failed to add item";
      this.banner = BannerMessage.error(msg);
    }
  }

  stopScanner() {
    if (this.video && this.video.srcObject) {
      this.video.pause();
      const stream = this.video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      this.video.srcObject = null;
    }
    if (this.zxingReader) {
      // No reset() method; just dereference for GC
      this.zxingReader = null;
    }
  }

  // --- Render helpers ---

  private renderVideoView() {
    return html`
      <span slot="title">Scan a Barcode</span>
      <span slot="header"></span>
      <p>Point camera at barcode</p>
      <div class="video-container">
        <video id="video" muted autoplay></video>
      </div>
      <div class="button-row">
        <select
          class="camera-select"
          @change=${(e: Event) => this.pickCameraDevice((e.target as HTMLSelectElement).value)}
        >
          ${this.availableCameras.length === 0
            ? html`<option disabled selected>No cameras found</option>`
            : this.availableCameras.map(
                (camera) => html`<option
                  value=${camera.deviceId}
                  ?selected=${this.selectedCameraId === camera.deviceId}
                >
                  ${camera.label || `Camera ${camera.deviceId}`}
                </option>`
              )}
        </select>
        <ha-button type="button" @click=${() => this.closeDialog()}>
          Close
        </ha-button>
      </div>
    `;
  }



  private renderBarcodeInfoView() {
    return html`
      <span slot="title">Product Details</span>
      <span slot="header"
        >Detected: ${this.scanState.barcode} (${this.scanState.format})</span
      >

      <div class="scanner-inputs">
        <ha-textfield
          label="Name"
          value=${this.editState.name}
          @input=${(e: any) => {
            this.editState = { ...this.editState, name: e.target.value };
            this.banner = null;
          }}
        ></ha-textfield>
        <ha-textfield
          label="Brand"
          value=${this.editState.brand}
          @input=${(e: any) => {
            this.editState = { ...this.editState, brand: e.target.value };
            this.banner = null;
          }}
        ></ha-textfield>
      </div>

      <span slot="footer">
        <ha-button type="button" @click=${() => this._addToList()}>
          Add to List
        </ha-button>
        <ha-button type="button" @click=${() => this.closeDialog()}>
          Close
        </ha-button>
      </span>
    `;
  }

  render() {
    const isBarcodeDetected = !!this.scanState.barcode;
    const view = isBarcodeDetected
      ? this.renderBarcodeInfoView()
      : this.renderVideoView();
    return html`
      <gsc-dialog-overlay
        .open=${this.open}
        width="400px"
        minWidth="400px"
        maxWidth="400px"
      >
        <gsc-message-banner .banner=${this.banner}></gsc-message-banner>
        ${view}
      </gsc-dialog-overlay>
    `;
  }
}

customElements.define("gsc-scanner-overlay", BarcodeScannerDialog);
