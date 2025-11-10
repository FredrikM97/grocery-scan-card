import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { translate } from '../translations/translations.js';
import '../components/action-button.js';

/**
 * <actions-renderer>
 * Encapsulates the action buttons for barcode-card
 */
export class ActionsSection extends LitElement {
  @property({ type: Boolean }) disabled = false;

  static styles = css`
    .actions-section {
      display: flex;
      width: 100%;
      justify-content: stretch;
      align-items: stretch;
      margin-bottom: 16px;
      gap: 0;
    }
    sl-action-button {
      flex: 1 1 0;
      min-width: 0;
      width: 100%;
      margin: 0;
      height: 48px;
      box-sizing: border-box;
    }
  `;

  private _handleScan(e: Event) {
    this.dispatchEvent(new CustomEvent('scan-barcode', { bubbles: true, composed: true }));
  }
  private _handleLookup(e: Event) {
    this.dispatchEvent(new CustomEvent('lookup', { bubbles: true, composed: true }));
  }
  private _handleRefresh(e: Event) {
    this.dispatchEvent(new CustomEvent('refresh-list', { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <div class="actions-section">
        <sl-action-button
          icon="mdi:camera"
          .label="${translate('actions.scan_barcode')}"
          @action-click="${this._handleScan}"
          ?disabled="${this.disabled}"
        ></sl-action-button>
        <sl-action-button
          icon="mdi:magnify"
          .label="${translate('actions.lookup') ?? 'Lookup'}"
          outlined
          @action-click="${this._handleLookup}"
          ?disabled="${this.disabled}"
        ></sl-action-button>
        <sl-action-button
          icon="mdi:format-list-bulleted"
          .label="${translate('actions.show_list') ?? 'Show Shopping List'}"
          outlined
          @action-click="${() => this.dispatchEvent(new CustomEvent('show-shopping-list', { bubbles: true, composed: true }))}"
          ?disabled="${this.disabled}"
        ></sl-action-button>
      </div>
    `;
  }
}

customElements.define('sl-actions-section', ActionsSection);
