import { describe, it, expect } from 'vitest';
import { UIManager } from '../card/views/ui-manager';
import { BarcodeCardConfig } from '../card/types';

describe('UIManager', () => {
  it('should instantiate with config and shadowRoot', () => {
    const config: BarcodeCardConfig = { title: 'Test', enable_camera: true, cache_products: true, show_completed: true, auto_add: false, type: 'barcode-card', entity: 'todo.test' };
    const div = document.createElement('div');
    const shadow = div.attachShadow({ mode: 'open' });
    const ui = new UIManager(shadow, config);
    expect(ui).toBeInstanceOf(UIManager);
  });
});