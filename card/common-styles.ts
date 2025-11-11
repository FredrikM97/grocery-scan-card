import { css } from "lit";

export const commonButtonStyles = css`
  .btn-outline {
    background: var(--card-background-color, #fff);
    border: 1px solid var(--divider-color, #e0e0e0);
    color: var(--primary-color, #2196f3);
    padding: 4px;
    font-size: 16px;
    border-radius: 50%;
    min-width: 28px;
    min-height: 28px;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background 0.2s,
      border-color 0.2s,
      color 0.2s;
  }
  .btn-outline:hover {
    background: var(--primary-color, #2196f3);
    border-color: var(--primary-color, #2196f3);
    color: #fff;
  }
  .sl-shopping-list-modal-close {
    min-width: 120px;
    padding: 8px 16px;
    font-size: 1rem;
    border-radius: var(--ha-card-border-radius, 6px);
    background: var(--primary-background-color, #fafafa);
    color: var(--primary-color, #2196f3);
    border: 1px solid var(--divider-color, #e0e0e0);
    cursor: pointer;
    margin-top: 24px;
    transition:
      background 0.2s,
      color 0.2s;
  }
  .sl-shopping-list-modal-close:hover {
    background: var(--primary-color, #2196f3);
    color: #fff;
  }
`;
