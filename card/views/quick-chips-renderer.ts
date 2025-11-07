import type { BarcodeCardConfig } from '../types';

class QuickChipsRenderer {
  private quickAddKey = 'barcodeCardQuickAddStats';
  private config: BarcodeCardConfig;

  constructor(config: BarcodeCardConfig) {
    this.config = config;
  }

  render(): string {
    const stats = this.getQuickAddStats();
    let sorted = Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
    if (sorted.length < 15) {
      const defaults = [
        'Milk', 'Bread', 'Eggs', 'Butter', 'Cheese', 'Bananas', 'Apples',
        'Tomatoes', 'Onions', 'Pasta', 'Rice', 'Chicken', 'Ground Beef'
      ];
      sorted = [...new Set([...sorted, ...defaults])].slice(0, 15);
    } else {
      sorted = sorted.slice(0, 15);
    }
    const chipItems = sorted.map(item => `
      <button class="quick-chip" data-product="${item}">
        ${item}
      </button>
    `).join('');
    return `
      <div class="quick-chips-section">
        <div class="section-header">
          <h3>Quick Add</h3>
          <span class="section-subtitle">Top 15 most added items</span>
        </div>
        <div class="chips-container">
          ${chipItems}
        </div>
      </div>
    `;
  }

  getQuickAddStats(): Record<string, number> {
    try {
      return JSON.parse(localStorage.getItem(this.quickAddKey) || '{}');
    } catch {
      return {};
    }
  }

  incrementQuickAdd(item: string): void {
    const stats = this.getQuickAddStats();
    stats[item] = (stats[item] || 0) + 1;
    localStorage.setItem(this.quickAddKey, JSON.stringify(stats));
  }
}

export { QuickChipsRenderer };
