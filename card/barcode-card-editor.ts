/**
 * Barcode Card Configuration Editor  
 * Provides a visual editor for the barcode card configuration
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BarcodeCardConfig } from './types';
import { loadHaComponents } from '@kipk/load-ha-components';

@customElement('barcode-card-editor')
export class BarcodeCardEditor extends LitElement {
    _onInput(e: Event) {
        const target = e.target as HTMLInputElement;
        if (!this.config) return;
        this.config = { ...this.config, title: target.value };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }
    @property({ type: Object }) hass?: any;
    @property({ type: Object }) config?: BarcodeCardConfig;
    @state() haComponentsReady: boolean = false;

    static styles = css`
        .card-config {
            padding: 16px;
        }
        .config-row {
            display: flex;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid var(--divider-color, #e0e0e0);
        }
        .config-row:last-child {
            border-bottom: none;
        }
        .config-label {
            flex: 1;
            font-weight: 500;
            color: var(--primary-text-color);
        }
        .config-input {
            flex: 2;
            margin-left: 16px;
        }
        .description {
            font-size: 12px;
            margin-top: 4px;
        }
        .section-header {
            font-size: 16px;
            font-weight: 600;
            color: var(--primary-text-color);
            margin: 16px 0 8px 0;
            border-bottom: 2px solid var(--primary-color);
            padding-bottom: 4px;
        }
        input, select {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--divider-color, #e0e0e0);
            border-radius: 4px;
            background: var(--card-background-color, white);
            color: var(--primary-text-color);
        }
        input[type="checkbox"] {
            width: auto;
        }
    `;

    async connectedCallback() {
        super.connectedCallback();
        await loadHaComponents(['ha-entity-picker', 'ha-form', 'ha-textfield']);
        this.haComponentsReady = true;
        this.requestUpdate();
    }

    setConfig(config: BarcodeCardConfig): void {
    console.log('[BarcodeCardEditor] setConfig called', config);
    this.config = { ...config };
    this.requestUpdate();
    }

    render() {
        if (!this.haComponentsReady) {
            return html`<div>Loading Home Assistant components...</div>`;
        }
        return html`
            <div class="card-config">
                <div class="section-header">Basic Settings</div>
                <div class="config-row">
                    <div class="config-label">
                        Title
                        <div class="description">Name displayed on the card</div>
                    </div>
                    <div class="config-input">
                        <ha-textfield
                            id="title"
                            name="title"
                            .value=${this.config?.title || ''}
                            @input=${this._onInput}
                            .label=${this.hass?.localize?.('ui.card.config.title_label') || 'Title'}
                            placeholder="Title"
                        ></ha-textfield>
                    </div>
                </div>
                <div class="config-row">
                    <div class="config-label">
                        Shopping List Entity
                        <div class="description">Select a Home Assistant todo entity</div>
                    </div>
                    <div class="config-input">
                        <ha-entity-picker
                            id="entity-picker"
                            .hass=${this.hass}
                            .value=${this.config?.entity || ''}
                            .configValue=${'entity'}
                            @value-changed=${this._entityChanged}
                            .includeDomains=${['todo']}
                        ></ha-entity-picker>
                    </div>
                </div>
                <div class="section-header">Camera & Scanner Settings</div>
                <div class="config-row">
                    <div class="config-label">
                        Enable Camera
                        <div class="description">Allow barcode scanning using device camera</div>
                    </div>
                    <div class="config-input">
                        <input type="checkbox" id="enable_camera" .checked="${this.config?.enable_camera !== false}" @change="${this._updateConfig}" />
                    </div>
                </div>
                <div class="section-header">Display Options</div>
                <div class="config-row">
                    <div class="config-label">
                        Show Header Toggle
                        <div class="description">Display toggle button in card header</div>
                    </div>
                    <div class="config-input">
                        <input type="checkbox" id="show_header_toggle" .checked="${this.config?.show_header_toggle !== false}" @change="${this._updateConfig}" />
                    </div>
                </div>
            </div>
        `;
    }

    _updateConfig() {
        if (!this.config) return;
        const shadow = this.shadowRoot as ShadowRoot;
        const getValue = (id: string) => {
            const el = shadow.getElementById(id) as any;
            if (!el) return null;
            if (el.type === 'checkbox') return el.checked;
            if (typeof el.value !== 'undefined') return el.value;
            return el.value || el.textContent || '';
        };
        const newConfig: BarcodeCardConfig = {
            ...this.config,
            title: getValue('title') as string,
            enable_camera: getValue('enable_camera') as boolean,
            show_header_toggle: getValue('show_header_toggle') as boolean,
        };
        this.config = newConfig;
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    _entityChanged(event: CustomEvent) {
        if (!this.config) return;
        this.config = { ...this.config, entity: event.detail.value };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }
}


// Register for card picker
declare global {
    interface Window {
        customCards: any[];
    }
}

if (typeof window !== 'undefined') {
    window.customCards = window.customCards || [];
    window.customCards.push({
        type: 'barcode-card',
        name: 'Barcode Card',
        description: 'A card for managing shopping lists with barcode scanning support',
        preview: true,
        documentationURL: 'https://github.com/FredrikM97/shopping-list-barcode',
    });
}