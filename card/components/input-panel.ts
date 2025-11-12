import { LitElement, html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { SHOPPING_LIST_REFRESH_EVENT } from "../const";
import { translate } from "../translations/translations.js";
import { ShoppingListService } from "../services/item-service.js";
import { fireEvent } from "../common.js";
import type { ShoppingListItem } from "../types";

/**
 * <add-item-panel>
 * Centralized add-item logic for barcode, manual, and quick add
 */
export class InputPanel extends LitElement {
  @property({ type: Object }) todoListService: ShoppingListService = null;
  @property({ type: String }) entityId: string = "";
  @state() private inputValue: string = "";
  @state() private inputCount: number = 1;

  static styles = css`
    .add-item-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      margin-bottom: 16px;
      padding: 16px 0;
      background: var(--card-background-color, #fff);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    }
    .input-container {
      display: flex;
      flex-direction: row;
      gap: 8px;
      width: 100%;
      justify-content: center;
      align-items: center;
      margin-top: 8px;
      padding: 0 8px;
    }
    ha-button {
      height: 40px;
      align-self: center;
      /* Match the height of ha-textfield for vertical alignment */
    }
  `;

  constructor() {
    super();
  }

  public setInputValue(value: string) {
    this.inputValue = value;
  }

  async _onAddItem() {
    if (!this.todoListService || !this.inputValue || !this.entityId) {
      console.error("No todo list integration or product name.");
      return;
    }
    try {
      const item: Partial<ShoppingListItem> = {
        name: this.inputValue,
        count: this.inputCount,
      };
      const result = await this.todoListService.addItem(
        this.inputValue,
        this.entityId,
        item,
      );
      if (!result) {
        console.error("Failed to add item to todo list");
      }
    } catch (error) {
      console.error("Failed to add item to todo list", error);
    }
  }

  render() {
    return html`
      <div class="add-item-panel">
        <div class="input-container">
          <ha-textfield
            type="text"
            .value="${this.inputValue}"
            placeholder="${translate("editor.placeholders.item") ?? "Enter product name"}"
            @input="${(e: any) => {
              this.inputValue = e.target.value;
            }}"
          ></ha-textfield>
          <ha-textfield
            type="number"
            min="1"
            .value="${String(this.inputCount)}"
            placeholder="Count"
            @input="${(e: any) => {
              this.inputCount = Number(e.target.value);
            }}"
          ></ha-textfield>
          <ha-button
            @click="${() => this._onAddItem()}"
          >
            ${translate("editor.labels.add_button")}
          </ha-button>
        </div>
      </div>
    `;
  }
}

customElements.define("sl-input-panel", InputPanel);