/**
 * Barcode Input Renderer
 * Handles the barcode input section
 */
import { translate } from '../translations/translations.js';

export class BarcodeInputRenderer {
    async lookupBarcode(productLookup, ui, handleProductFound, showManualAddOption) {
        const barcode = this.getBarcodeInput().trim();

        if (!barcode) {
            ui?.showError(translate('errors.empty_barcode'));
            return;
        }

        if (!/^\d{8,13}$/.test(barcode)) {
            ui?.showError(translate('errors.invalid_barcode'));
            return;
        }

        ui?.setLoading(true);
        ui?.hideError();
        ui?.hideProductInfo();

        try {
            const product = await productLookup?.getProductInfo(barcode);

            if (product) {
                handleProductFound(product);
            } else {
                ui?.showError(translate('errors.product_not_found'));
                showManualAddOption(barcode);
            }
        } catch (error) {
            console.error('Barcode lookup error:', error);
            ui?.showError(translate('errors.lookup_failed'));
        } finally {
            ui?.setLoading(false);
        }
    }
    getBarcodeInput(): string {
        const input = document.getElementById('barcodeInput') as HTMLInputElement;
        return input?.value || '';
    }

    setBarcodeInput(value: string): void {
        const input = document.getElementById('barcodeInput') as HTMLInputElement;
        if (input) {
            input.value = value;
        }
    }
    config: any;
    constructor(config = {}) {
        this.config = config;
    }

    render() {
        return `
            <div class="barcode-input-section">
                <div class="input-container">
                    <input 
                        type="text" 
                        class="barcode-input" 
                        id="barcodeInput"
                        placeholder="${translate('barcode.placeholder')}"
                        pattern="[0-9]*"
                        inputmode="numeric"
                    >
                    <button class="btn btn-primary" id="lookupBtn">
                        <span class="btn-text">${translate('barcode.lookup_button')}</span>
                        <span class="loading-spinner" style="display: none;"></span>
                    </button>
                </div>
                <div id="productInfo" style="display: none;"></div>
                <div id="errorMessage" style="display: none;"></div>
                <div id="successMessage" style="display: none;"></div>
            </div>
        `;
    }

    attachListeners(container: HTMLElement) {
        const input = container.querySelector('#barcodeInput');
        const lookupBtn = container.querySelector('#lookupBtn');
        if (input) {
            input.addEventListener('keypress', (e) => {
                const ke = e as KeyboardEvent;
                if (ke.key === 'Enter') {
                    this._dispatchEvent(container, 'lookup-barcode');
                }
            });
        }
        if (lookupBtn) {
            lookupBtn.addEventListener('click', () => {
                this._dispatchEvent(container, 'lookup-barcode');
            });
        }
    }

    _dispatchEvent(container: HTMLElement, eventName: string, detail: any = {}) {
        const event = new CustomEvent(eventName, { detail });
        container.dispatchEvent(event);
    }

    getStyles() {
        return `
            .barcode-input-section {
                margin-bottom: 16px;
            }

            .input-container {
                display: flex;
                gap: 8px;
                margin-bottom: 12px;
            }

            .barcode-input {
                flex: 1;
                padding: 12px;
                border: 1px solid var(--divider-color);
                border-radius: 4px;
                background: var(--card-background-color);
                color: var(--primary-text-color);
                font-size: 16px;
            }

            .barcode-input:focus {
                outline: none;
                border-color: var(--primary-color);
                box-shadow: 0 0 0 2px var(--primary-color-alpha);
            }

            .product-info {
                background: var(--secondary-background-color);
                padding: 12px;
                border-radius: 4px;
                margin-bottom: 12px;
                border-left: 4px solid var(--primary-color);
            }

            .product-name {
                font-weight: 500;
                margin-bottom: 4px;
            }

            .product-details {
                font-size: 0.9em;
                color: var(--secondary-text-color);
            }

            .error-message {
                background: #ffebee;
                color: #c62828;
                padding: 12px;
                border-radius: 4px;
                margin-bottom: 12px;
                border-left: 4px solid #c62828;
            }

            .success-message {
                background: #e8f5e8;
                color: #2e7d32;
                padding: 12px;
                border-radius: 4px;
                margin-bottom: 12px;
                border-left: 4px solid #2e7d32;
            }
        `;
    }
}
