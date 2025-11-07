import { describe, it, expect } from 'vitest';
import { ShoppingListManager } from '../card/services/list-manager';

describe('ShoppingListManager', () => {
  it('should instantiate with hass', () => {
    const hass = { services: {}, states: {} };
    const manager = new ShoppingListManager(hass);
    expect(manager).toBeInstanceOf(ShoppingListManager);
  });

  it('should format product description', () => {
    const hass = { services: {}, states: {} };
    const manager = new ShoppingListManager(hass);
    const product = { barcode: '123', brand: 'Brand', source: 'manual' };
    expect(manager.formatProductDescription(product)).toContain('Brand: Brand');
    expect(manager.formatProductDescription(product)).toContain('Barcode: 123');
    expect(manager.formatProductDescription(product)).toContain('Source: manual');
  });
});