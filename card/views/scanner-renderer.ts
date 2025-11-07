import { translate } from '../translations/translations.js';

class ScannerRenderer {
  async startScanning(scanner, ui, config, onBarcodeScanned) {
    if (!config.enable_camera) {
      ui.showError(translate('errors.camera_disabled'));
      return;
    }

    try {
      const isSupported = await scanner.isSupported();
      if (!isSupported) {
        const userAgent = navigator.userAgent.toLowerCase();
        let browserMessage = '';
        if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
          browserMessage = 'Camera scanning works in Safari! Please allow camera access when prompted.';
        } else if (userAgent.includes('firefox')) {
          browserMessage = 'Camera scanning works in Firefox! Please allow camera access when prompted.';
        } else if (userAgent.includes('chrome')) {
          browserMessage = 'Camera scanning works in Chrome! Please allow camera access when prompted.';
        } else {
          browserMessage = translate('errors.browser_not_supported');
        }
        ui.showError(browserMessage);
        return;
      }

      ui.showScanner();
      const video = ui.getScannerVideo();

      await scanner.startScanning(
        video,
        (barcode) => {
          onBarcodeScanned(barcode);
        },
        (error) => {
          console.error('Scanner error:', error);
          ui.hideScanner();
          let errorMessage = error.message;
          if (error.name === 'NotAllowedError') {
            errorMessage = 'Camera access denied. Please allow camera permissions in your browser settings and refresh the page.';
          } else if (error.name === 'NotFoundError') {
            errorMessage = 'No camera found. Please ensure your device has a camera connected.';
          } else if (error.name === 'NotReadableError') {
            errorMessage = 'Camera is already in use by another application. Please close other apps using the camera.';
          } else if (error.name === 'OverconstrainedError') {
            errorMessage = 'Camera constraints not supported. Trying with different settings...';
          }
          ui.showError(errorMessage);
        }
      );
    } catch (error) {
      console.error('Start scanning error:', error);
      ui.showError('Unable to start camera. Please check your browser permissions and try again.');
    }
  }

  stopScanning(scanner, ui) {
    scanner.stopScanning();
    ui.hideScanner();
  }
  private scannerElement: HTMLElement;
  private videoElement: HTMLVideoElement;

  constructor(scannerElement: HTMLElement, videoElement: HTMLVideoElement) {
    this.scannerElement = scannerElement;
    this.videoElement = videoElement;
  }

  render(): string {
    return `
      <div class="barcode-scanner" id="barcodeScanner">
        <video class="scanner-video" id="scannerVideo" autoplay playsinline></video>
        <div class="scanner-overlay"></div>
        <div class="scanner-controls">
          <button class="btn btn-secondary" id="stopScanBtn">
            <ha-icon icon="mdi:stop"></ha-icon>
            Stop Scanning
          </button>
        </div>
      </div>
    `;
  }

  show(): void {
    this.scannerElement.classList.add('active');
  }

  hide(): void {
    this.scannerElement.classList.remove('active');
  }

  getVideo(): HTMLVideoElement {
    return this.videoElement;
  }
}

export { ScannerRenderer };
