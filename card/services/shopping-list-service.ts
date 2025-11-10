  
/**
 * ShoppingListService - Unified Home Assistant shopping/todo list service
 */
import { ShoppingListItem } from '../types';
export class ShoppingListService {
  private hass: Record<string, unknown>;

  constructor(hass: Record<string, unknown>) {
    this.hass = hass;
  }

  async addItem(
    name: string,
    entityId: string,
    description: string | { barcode?: string; count?: number } = ''
  ): Promise<boolean> {
    let opts: { barcode?: string; count?: number } = {};
    if (typeof description === 'object' && description !== null) {
      opts = description;
    }
    const barcode: string = opts.barcode || '';
    const count: number = typeof opts.count === 'number' ? opts.count : 1;
    try {
      if (!this.hass || !entityId || !name) {
        return false;
      }
      const items: ShoppingListItem[] = await this.getItems(entityId);
      const normalizedName: string = name.trim().toLowerCase();
      const existing: ShoppingListItem | undefined = items.find((item: ShoppingListItem) => {
        const itemName: string = (item.name || '').trim().toLowerCase();
        return itemName === normalizedName && !item.completed;
      });
      let newCount: number = count;
      let newTotal: number = count;
      if (existing) {
        newCount = (existing.count ?? 0) + count;
        newTotal = (existing.total ?? 0) + count;
        const newDesc: string = `barcode:${barcode};count:${newCount};total:${newTotal}`;
        const itemId: string = existing.id;
        await (this.hass as any).callService('todo', 'update_item', {
          entity_id: entityId,
          item: itemId,
          description: newDesc
        });
        return true;
      } else {
        const newDesc: string = `barcode:${barcode};count:${count};total:${count}`;
        await (this.hass as any).callService('todo', 'add_item', {
          entity_id: entityId,
          item: name,
          description: newDesc
        });
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  async getItems(entityId: string): Promise<ShoppingListItem[]> {
    try {
      const wsResult = await (this.hass as any).callWS({
        type: "call_service",
        domain: "todo",
        service: "get_items",
        service_data: { entity_id: entityId },
        return_response: true
      });
      const rawItems = wsResult?.response?.[entityId]?.items || [];
      const items: ShoppingListItem[] = (rawItems || []).map((item: {
        uid?: string;
        id?: string;
        name?: string;
        summary?: string;
        status?: string;
        description?: string;
      }) => {
        const desc = item.description || '';
        const barcodeMatch = desc.match(/barcode:([^;]*)/);
        const countMatch = desc.match(/count:(\d+)/);
        const totalMatch = desc.match(/total:(\d+)/);
        return {
          id: item.uid || item.id || item.name || '',
          name: item.summary || item.name || '',
          completed: item.status === 'completed',
          barcode: barcodeMatch ? barcodeMatch[1] : undefined,
          count: countMatch ? parseInt(countMatch[1], 10) : 0,
          total: totalMatch ? parseInt(totalMatch[1], 10) : 0
        };
      });
      return items;
    } catch (error) {
      return [];
    }
  }

  async toggleComplete(itemId: string, entityId: string): Promise<boolean> {
    try {
      const items: ShoppingListItem[] = await this.getItems(entityId);
      const item = items.find(i => i.id === itemId);
      if (!item) throw new Error('Item not found');
      const newDesc = `barcode:${item.barcode ?? ''};count:0;total:${item.total ?? 0}`;
      await (this.hass as any).callService('todo', 'update_item', {
        entity_id: entityId,
        item: itemId,
        status: 'completed',
        description: newDesc
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async clearCompleted(entityId: string): Promise<boolean> {
    try {
      const items: ShoppingListItem[] = await this.getItems(entityId);
      const completedItems = items.filter(i => i.completed);
      for (const item of completedItems) {
        const newDesc = `barcode:${item.barcode ?? ''};count:0;total:${item.total ?? 0}`;
        await (this.hass as any).callService('todo', 'update_item', {
          entity_id: entityId,
          item: item.id,
          status: 'completed',
          description: newDesc
        });
      }
      // Optionally call clear_completed_items if needed
      const availableServices = (this.hass as any).services || {};
      if (availableServices['todo'] && availableServices['todo']['clear_completed_items']) {
        await (this.hass as any).callService('todo', 'clear_completed_items', {
          entity_id: entityId
        });
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  formatProductDescription(product: { brand?: string; barcode?: string; source?: string } | null): string {
    if (!product) return '';
    const parts = [];
    if (product.brand) parts.push(`Brand: ${product.brand}`);
    if (product.barcode) parts.push(`Barcode: ${product.barcode}`);
    if (product.source) parts.push(`Source: ${product.source}`);
    return parts.join(' | ');
  }
}
