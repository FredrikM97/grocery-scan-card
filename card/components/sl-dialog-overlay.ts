import { LitElement, html, css, PropertyValues } from "lit";
import { property, query } from "lit/decorators.js";

/**
 * <sl-dialog-overlay>
 * A reusable dialog overlay component themed for this project.
 * - Centers relative to hui-root if present, otherwise fixed to viewport.
 * - Applies project/HA theme (background, border-radius, shadow, font, etc).
 * - Slot for dialog content.
 */
export class SlDialogOverlay extends LitElement {
  @property({ type: Boolean }) open = false;
  @property({ type: String }) header = "";

  static styles = css`
    .dialog-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.32);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      transition: background 0.2s;
    }
    .dialog-wrapper {
      min-width: 300px;
      width: 100%;
      max-width: 420px;
      min-height: 0;
      max-height: 95vh;
      background: var(--ha-card-background, var(--card-background-color, #fff));
      color: var(--ha-card-text-color, var(--primary-text-color, #333));
      border-radius: var(--ha-card-border-radius, 16px);
      box-shadow: 0 6px 32px 0 rgba(0,0,0,0.18), 0 1.5px 4px 0 rgba(0,0,0,0.12);
      font-family: var(--ha-font-family, var(--paper-font-body1_-_font-family, system-ui));
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      border: none;
      padding: 0;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
      animation: dialog-fade-in 0.18s cubic-bezier(.4,0,.2,1);
    }
    @keyframes dialog-fade-in {
      from { opacity: 0; transform: translateY(24px) scale(0.98); }
      to { opacity: 1; transform: none; }
    }
    .dialog-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px 8px 24px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      background: transparent;
    }
    .dialog-header-title {
      font-size: 1.25em;
      font-weight: 700;
      flex: 1 1 auto;
      color: var(--ha-card-header-color, var(--primary-text-color, #222));
      margin: 0;
      padding: 0;
      text-align: left;
    }
    .dialog-header {
      font-size: 1em;
      color: var(--secondary-text-color, #666);
      margin-left: 12px;
      flex: 0 0 auto;
    }
    .dialog-content {
      padding: 20px 24px 12px 24px;
      flex: 1 1 auto;
      overflow-y: auto;
      background: transparent;
    }
    .dialog-footer {
      padding: 12px 24px 20px 24px;
      border-top: 1px solid var(--divider-color, #e0e0e0);
      background: transparent;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  `;


  render() {
    if (!this.open) return html``;
    return html`
      <div class="dialog-backdrop">
        <div class="dialog-wrapper">
          <div class="dialog-header-row">
            <span class="dialog-header-title">
              <slot name="title"></slot>
            </span>
            <span class="dialog-header">
              <slot name="header">${this.header}</slot>
            </span>
          </div>
          <div class="dialog-content">
            <slot></slot>
          </div>
          <div class="dialog-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("sl-dialog-overlay", SlDialogOverlay);
