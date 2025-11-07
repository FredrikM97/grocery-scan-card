import { describe, it, expect } from 'vitest';
import { BarcodeCard } from '../card/barcode-card';

describe('BarcodeCard', () => {
  it('should instantiate and set config', () => {
    const card = new BarcodeCard();
    const config = { title: 'Test', enable_camera: true, cache_products: true, show_completed: true, auto_add: false, type: 'barcode-card', entity: 'todo.test' };
    card.setConfig(config);
    expect(card.config).toEqual(config);
  });

  it('should call getCardSize', () => {
    const card = new BarcodeCard();
    expect(card.getCardSize()).toBe(4);
  });
});