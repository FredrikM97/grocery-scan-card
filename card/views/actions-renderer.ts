/**
 * Actions Renderer
 * Handles the action buttons section
 */
import { translate } from '../translations/translations.js';

export class ActionsRenderer {
    constructor(config = {}) {
        this.config = config;
    }

    render() {
        return `
            <div class="actions-section">
                <button class="btn btn-secondary" id="scanBtn">
                    <ha-icon icon="mdi:camera"></ha-icon>
                    ${translate('actions.scan_barcode')}
                </button>
                <button class="btn btn-outline" id="addManualBtn">
                    <ha-icon icon="mdi:plus"></ha-icon>
                    ${translate('actions.add_manual')}
                </button>
                <button class="btn btn-outline" id="refreshBtn">
                    <ha-icon icon="mdi:refresh"></ha-icon>
                    ${translate('actions.refresh')}
                </button>
            </div>
        `;
    }

    getStyles() {
        return `
            .actions-section {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
                flex-wrap: wrap;
            }

            .btn {
                padding: 12px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }

            .btn-primary {
                background: var(--primary-color);
                color: white;
            }

            .btn-secondary {
                background: var(--secondary-color, #6c757d);
                color: white;
            }

            .btn-outline {
                background: transparent;
                color: var(--primary-color);
                border: 1px solid var(--primary-color);
            }

            .loading-spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid transparent;
                border-top: 2px solid currentColor;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            @media (max-width: 600px) {
                .actions-section {
                    flex-direction: column;
                }
                
                .btn {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;
    }
}
