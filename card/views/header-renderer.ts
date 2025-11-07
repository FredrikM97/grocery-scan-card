/**
 * Header Renderer
 * Handles the card header rendering
 */
import { translate } from '../translations/translations.js';

export class HeaderRenderer {
    constructor(config = {}) {
        this.config = config;
    }

    render() {
        return `
            <div class="card-header">
                <h2 class="card-title">
                    <ha-icon icon="mdi:barcode-scan"></ha-icon>
                    ${this.config.title || translate('card.header.title')}
                </h2>
            </div>
        `;
    }

    getStyles() {
        return `
            .card-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 16px;
                padding-bottom: 8px;
                border-bottom: 1px solid var(--divider-color);
            }

            .card-title {
                font-size: 1.2em;
                font-weight: 500;
                color: var(--primary-text-color);
                margin: 0;
                display: flex;
                align-items: center;
                gap: 8px;
            }
        `;
    }
}
