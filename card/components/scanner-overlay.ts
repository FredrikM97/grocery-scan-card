import { loadHaComponents } from "@kipk/load-ha-components";
import { LitElement, html, css } from "lit";
import { property, query, state } from "lit/decorators.js";
import { BarcodeScanner } from "../services/barcode-service";

/**
 * <scanner-overlay>
 * Displays the barcode scanner video and controls
 */
export class ScannerOverlay extends LitElement {
  @property({ type: Boolean }) private active = false;
  @property({ type: Object }) private scanner: BarcodeScanner = null;

  static styles = css`
    .scanner-controls {
      margin-top: 20px;
      display: flex;
      gap: 16px;
    }
    .scanner-dialog-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      padding: 0;
    }
    .scanner-video {
      width: 100%;
      height: 100%;
      max-width: 640px;
      max-height: 480px;
      border-radius: 8px;
      background: #222;
      margin-bottom: 20px;
      object-fit: contain;
      display: block;
    }
    .close-btn {
      background: #fff;
      color: #333;
      border: none;
      border-radius: 50%;
      padding: 12px;
      font-size: 18px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
  `;

  constructor() {
    super();
    this.scanner = new BarcodeScanner();
  }
  async connectedCallback() {
    super.connectedCallback();
    await loadHaComponents(["ha-dialog"]);
    window.addEventListener("enable-scanner", this._handleEnableScanner);
    console.log("[ScannerOverlay] connectedCallback");
  }

  disconnectedCallback() {
    window.removeEventListener("enable-scanner", this._handleEnableScanner);
    super.disconnectedCallback();
    console.log("[ScannerOverlay] disconnectedCallback");
  }

  private _handleEnableScanner = () => {
    this.active = true;
    this.requestUpdate();
    // Start scanner directly when enabled
    this.updateComplete.then(() => {
      console.log("[ScannerOverlay] _handleEnableScanner: starting scanner");
      const videoEl = this.shadowRoot?.getElementById(
        "scannerVideo",
      ) as HTMLVideoElement;
      this.scanner.startScanning(
        videoEl,
        (barcode: string) => {
          console.log("[ScannerOverlay] Barcode scanned:", barcode);
          this._handleClose();
          this.dispatchEvent(
            new CustomEvent("barcode-scanned", {
              detail: { barcode },
              bubbles: true,
              composed: true,
            }),
          );
        },
        (error: Error) => {
          console.log("[ScannerOverlay] Scanner error:", error);
        },
      );
    });
  };

  private _handleClose() {
    this.active = false;
    this.scanner.stopScanning();
    this.requestUpdate();
  }

  render() {
    console.log("[ScannerOverlay] render called, active:", this.active);
    if (!this.active) return html``;
    return html`
      <ha-dialog .open=${this.active}>
        <div class="scanner-dialog-content">
          <video
            id="scannerVideo"
            class="scanner-video"
            autoplay
            muted
            playsinline
          ></video>
          <button class="close-btn" @click="${this._handleClose}" title="Close">
            ✕
          </button>
        </div>
      </ha-dialog>
    `;
  }
}

customElements.define("sl-scanner-overlay", ScannerOverlay);
