import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { translate } from '../translations/translations.js';
import { ShoppingListService } from '../services/item-service.js';

/**
 * <add-item-panel>
 * Centralized add-item logic for barcode, manual, and quick add
 */
export class InputPanel extends LitElement {
  /**
   * Allows parent to set the input value programmatically (e.g. from barcode scan)
   */
  public setInputValue(value: string) {
    console.log('[AddItemPanel] setInputValue called with:', value);
    this.inputValue = value;
    this.requestUpdate();
  }
 
  
  static styles = css`
    .add-item-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      margin-bottom: 16px;
      padding: 16px 0;
      background: var(--card-background-color, #fff);
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }
    .input-container {
      display: flex;
      flex-direction: row;
      gap: 8px;
      width: 100%;
      justify-content: center;
      align-items: stretch;
      margin-top: 8px;
      padding: 0 8px;
    }
    .add-item-input {
      flex: 2;
      min-width: 120px;
      max-width: 220px;
      padding: 8px 12px;
      font-size: 16px;
      border-radius: 6px;
      border: 1px solid var(--divider-color, #e0e0e0);
      outline: none;
      box-sizing: border-box;
    }
    .add-item-count {
      flex: 1;
      min-width: 60px;
      max-width: 80px;
      padding: 8px 12px;
      font-size: 16px;
      border-radius: 6px;
      border: 1px solid var(--divider-color, #e0e0e0);
      outline: none;
      box-sizing: border-box;
    }
    .btn.btn-primary {
      flex: 1;
      min-width: 80px;
      max-width: 120px;
      background: var(--primary-color, #2196f3);
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 10px 0;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.2s;
      font-weight: 500;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .add-item-input, .add-item-count {
      padding: 8px 12px;
      font-size: 16px;
      border-radius: 6px;
      border: 1px solid var(--divider-color, #e0e0e0);
      outline: none;
      width: 180px;
      box-sizing: border-box;
    }
    .add-item-count {
      width: 80px;
    }
    .btn.btn-primary {
      background: var(--primary-color, #2196f3);
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.2s;
      font-weight: 500;
    }
    .btn.btn-primary:disabled {
      background: #bdbdbd;
      color: #fff;
      cursor: not-allowed;
      opacity: 0.7;
    }
  `;

  @property({ type: Object }) todoListService: ShoppingListService = null;
  @property({ type: String }) entityId: string = '';
  @state() private inputValue: string = '';
  @state() private inputCount: number = 1;


  constructor() {
    super();
  }
  async _onAddItem() {
    if (!this.todoListService || !this.inputValue || !this.entityId) {
      console.error('No todo list integration or product name.');
      return;
    }
    try {
      const description = `count:${this.inputCount}`;
      const result = await this.todoListService.addItem(this.inputValue, this.entityId, description);
      if (result) {
        this.dispatchEvent(new CustomEvent('shopping-list-refresh', { bubbles: true, composed: true }));
      } else {
        console.error('Failed to add item to todo list');
      }
    } catch (error) {
      console.error('Failed to add item to todo list', error);
    }
  }

  render() {
    return html`
      <div class="add-item-panel">
        <div class="input-container">
          <input
            type="text"
            class="add-item-input"
            .value="${this.inputValue}"
            placeholder="${translate('editor.placeholders.item') ?? 'Enter product name'}"
            @input="${(e: any) => { this.inputValue = e.target.value; this.requestUpdate(); }}"
          >
          <input
            type="number"
            min="1"
            class="add-item-count"
            .value="${this.inputCount}"
            placeholder="Count"
            @input="${(e: any) => { this.inputCount = Number(e.target.value); }}"
          >
          <button
            class="btn btn-primary"
            @click="${() => this._onAddItem()}"
          >
            <span class="btn-text">${translate('editor.labels.add_button') || 'Add'}</span>
          </button>
        </div>
      </div>
    `;
  }
}

customElements.define('sl-input-panel', InputPanel);
