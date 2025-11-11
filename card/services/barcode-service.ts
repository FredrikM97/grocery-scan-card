import { BARCODE_FORMATS, QUAGGA_READERS } from "../const";
/**
 * Barcode Scanner Module
 * Enhanced browser compatibility for Safari, Firefox, Chrome, and HA Companion
 */

// Declare global types for libraries
declare global {
  interface Window {
    BarcodeDetector?: any;
    Quagga?: any;
  }
}

class BarcodeScanner {
  private isScanning: boolean = false;
  private stream: MediaStream | null = null;
  private detector: any = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private animationFrame: number | null = null;

  constructor() {
    // Properties are initialized above
  }

  async isSupported() {
    // Check for camera support first
    const hasCamera = !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    );

    // Check for barcode detection capabilities
    const hasNativeDetector = "BarcodeDetector" in window;
    const canLoadQuagga = true; // QuaggaJS works in most browsers

    return hasCamera && (hasNativeDetector || canLoadQuagga);
  }

  async startScanning(
    videoElement: HTMLVideoElement,
    onBarcodeDetected: (barcode: string) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    if (this.isScanning) return;

    try {
      this.video = videoElement;
      this.isScanning = true;

      // Enhanced camera constraints for better compatibility
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280, max: 1920, min: 640 },
          height: { ideal: 720, max: 1080, min: 480 },
        },
      };

      // Try with ideal constraints first
      try {
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Fallback to basic constraints for older browsers/devices
        console.warn("Falling back to basic camera constraints");
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
      }

      this.video.srcObject = this.stream;
      await this.video.play();

      // Use native BarcodeDetector if available (Chrome/Edge)
      if (window.BarcodeDetector) {
        await this._startNativeDetection(onBarcodeDetected);
      } else {
        // Fallback to QuaggaJS for Safari, Firefox, and older browsers
        await this._startQuaggaDetection(onBarcodeDetected);
      }
    } catch (error) {
      this.stopScanning();
      onError(error as Error);
    }
  }

  private async _startNativeDetection(
    onBarcodeDetected: (barcode: string) => void,
  ): Promise<void> {
    if (!window.BarcodeDetector) return;

    this.detector = new window.BarcodeDetector({
      formats: BARCODE_FORMATS,
    });

    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");

    const detectLoop = async () => {
      if (!this.isScanning) return;

      try {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.context.drawImage(this.video, 0, 0);

        const barcodes = await this.detector.detect(this.canvas);
        if (barcodes.length > 0) {
          onBarcodeDetected(barcodes[0].rawValue);
          return; // Stop scanning after first detection
        }
      } catch (error) {
        console.warn("Barcode detection error:", error);
      }

      // Continue scanning
      this.animationFrame = requestAnimationFrame(detectLoop);
    };

    detectLoop();
  }

  private async _startQuaggaDetection(
    onBarcodeDetected: (barcode: string) => void,
  ): Promise<void> {
    // Load QuaggaJS if not available
    if (!window.Quagga) {
      await this._loadQuagga();
    }

    // Enhanced QuaggaJS configuration for better compatibility
    const config = {
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: this.video,
        constraints: {
          width: { min: 640, ideal: 1280 },
          height: { min: 480, ideal: 720 },
          facingMode: "environment",
          aspectRatio: { min: 1, max: 2 },
        },
        singleChannel: false, // Use all color channels for better detection
      },
      locator: {
        patchSize: "medium",
        halfSample: true,
      },
      numOfWorkers: 2,
      frequency: 10, // Scan frequency
      decoder: {
        readers: QUAGGA_READERS,
        debug: {
          showCanvas: false,
          showPatches: false,
          showFoundPatches: false,
          showSkeleton: false,
          showLabels: false,
          showPatchLabels: false,
          showRemainingPatchLabels: false,
          boxFromPatches: {
            showTransformed: false,
            showTransformedBox: false,
            showBB: false,
          },
        },
      },
      locate: true,
    };

    return new Promise((resolve, reject) => {
      window.Quagga.init(config, (err: any) => {
        if (err) {
          console.error("QuaggaJS init error:", err);
          reject(err);
          return;
        }

        window.Quagga.start();

        // Set up detection handler
        window.Quagga.onDetected((result: any) => {
          const code = result.codeResult.code;
          // Validate barcode before reporting
          if (this.isValidBarcode(code)) {
            onBarcodeDetected(code);
          }
        });

        resolve();
      });
    });
  }

  private async _loadQuagga(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.Quagga) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://unpkg.com/quagga@0.12.1/dist/quagga.min.js";
      script.async = true;
      script.onload = () => {
        // Verify QuaggaJS loaded properly
        if (window.Quagga) {
          resolve();
        } else {
          reject(new Error("Failed to load QuaggaJS"));
        }
      };
      script.onerror = (error) => {
        reject(new Error("Failed to load QuaggaJS library"));
      };

      // Add script to document
      document.head.appendChild(script);
    });
  }

  public isValidBarcode(code: string): boolean {
    // Basic barcode validation
    if (!code || typeof code !== "string") return false;
    // Remove any whitespace
    const cleanCode = code.trim();
    // Check length (most common barcode lengths)
    const validLengths = [8, 12, 13, 14]; // EAN-8, UPC-A, EAN-13, GTIN-14
    if (!validLengths.includes(cleanCode.length)) return false;
    // Check if it's all digits
    if (!/^\d+$/.test(cleanCode)) return false;
    return true;
  }

  stopScanning(): void {
    this.isScanning = false;

    // Cancel native detection loop
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Stop QuaggaJS if running
    if (window.Quagga && typeof window.Quagga.stop === "function") {
      try {
        window.Quagga.stop();
        window.Quagga.offDetected(); // Remove detection handlers
      } catch (error) {
        console.warn("Error stopping QuaggaJS:", error);
      }
    }

    // Stop camera stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
      this.stream = null;
    }

    // Clean up video element
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }

    // Clean up detection objects
    this.detector = null;
    this.canvas = null;
    this.context = null;
  }
}

export { BarcodeScanner };
