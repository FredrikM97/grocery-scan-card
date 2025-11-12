/**
 * ShoppingListService - Unified Home Assistant shopping/todo list service
 */
import { TODO_ADD_ITEM, TODO_CLEAR_COMPLETED, TODO_DOMAIN, TODO_UPDATE_ITEM, TODO_CALL_SERVICE, TODO_GET_ITEMS } from "../const";
import { ShoppingListItem, ShoppingListStatus } from "../types";


export class ShoppingListService {
  // Only one hass property should exist, remove duplicate

  private hass: Record<string, unknown>;

  constructor(hass: Record<string, unknown>) {
    this.hass = hass;
  }

  async addItem(
    name: string,
    entityId: string,
    itemData: Partial<ShoppingListItem> = {},
  ): Promise<boolean> {
    // Check service availability directly
    if (!((this.hass as any).services?.[TODO_DOMAIN]?.[TODO_ADD_ITEM])) {
      console.warn(`[ShoppingListService] addItem failed: '${TODO_DOMAIN}.${TODO_ADD_ITEM}' service not available`, {
        services: (this.hass as any).services,
      });
      return false;
    }

    // Find existing item by normalized name and barcode
    const items = await this.getItems(entityId);
    const existing = items.find(item =>
      this.normalizeString(item.name) === this.normalizeString(name) &&
      (item.barcode ?? "") === (itemData.barcode ?? "")
    );

    if (existing) {
      const updatedItem = this.getUpdatedItem(existing, itemData);
      const newDesc = this.itemToDescription(updatedItem);
      await (this.hass as any).callService(TODO_DOMAIN, TODO_UPDATE_ITEM, {
        entity_id: entityId,
        item: existing.id,
        description: newDesc,
        status: updatedItem.status,
      });
      return true;
    }

    // No existing item: create new
    return await this.createNewItem({
      id: "", // will be set by backend
      name,
      status: ShoppingListStatus.NeedsAction,
      barcode: itemData.barcode ?? "",
      brand: itemData.brand,
      count: itemData.count ?? 1,
      total: itemData.count ?? 1,
    }, entityId);
  }

  // Helper to process item update logic
  private getUpdatedItem(existing: ShoppingListItem, itemData: Partial<ShoppingListItem>): ShoppingListItem {
    const isCompleted = existing.status === ShoppingListStatus.Completed;
    return {
      ...existing,
      count: isCompleted ? (itemData.count ?? 1) : (existing.count ?? 0) + (itemData.count ?? 1),
      total: (existing.total ?? 0) + (itemData.count ?? 1),
      status: isCompleted ? ShoppingListStatus.NeedsAction : existing.status,
    };
  }

  // Helper to create and add a new item
  private async createNewItem(
    item: ShoppingListItem,
    entityId: string
  ): Promise<boolean> {
    const newDesc = this.itemToDescription(item);
    await (this.hass as any).callService(TODO_DOMAIN, TODO_ADD_ITEM, {
      entity_id: entityId,
      item: item.name,
      description: newDesc,
    });
    return true;
  }

  // Consistent normalization helper
  private normalizeString(str?: string): string {
    return (str ?? "").trim().toLowerCase();
  }

  private rawToShoppingListItem(item: any): ShoppingListItem {
    const desc = item.description || "";
    const barcodeMatch = desc.match(/barcode:([^;]*)/);
    const brandMatch = desc.match(/brand:([^;]*)/);
    const countMatch = desc.match(/count:(\d+)/);
    const totalMatch = desc.match(/total:(\d+)/);
    return {
      id: item.uid || item.id || item.name || "",
      name: item.summary || item.name || "",
      status: item.status,
      barcode: barcodeMatch ? barcodeMatch[1] : undefined,
      brand: brandMatch ? brandMatch[1] : undefined,
      count: countMatch ? parseInt(countMatch[1], 10) : 0,
      total: totalMatch ? parseInt(totalMatch[1], 10) : 0,
    };
  }

  async getItems(entityId: string): Promise<ShoppingListItem[]> {
    try {
      const wsResult = await (this.hass as any).callWS({
        type: TODO_CALL_SERVICE,
        domain: TODO_DOMAIN,
        service: TODO_GET_ITEMS,
        service_data: { entity_id: entityId },
        return_response: true,
      });
      const rawItems = wsResult?.response?.[entityId]?.items || [];
      return (rawItems || []).map(this.rawToShoppingListItem);
    } catch (error) {
      return [];
    }
  }

  // Convert ShoppingListItem to description string
  private itemToDescription(item: ShoppingListItem): string {
    return `barcode:${item.barcode ?? ""};brand:${item.brand ?? ""};count:${item.count ?? 0};total:${item.total ?? 0}`;
  }

  async toggleComplete(itemId: string, entityId: string): Promise<boolean> {
    try {
      const items: ShoppingListItem[] = await this.getItems(entityId);
      const item = items.find((i) => i.id === itemId);
      if (!item) throw new Error("Item not found");
      const completedItem: ShoppingListItem = {
        ...item,
        count: 0,
        status: ShoppingListStatus.Completed,
      };
      const newDesc = this.itemToDescription(completedItem);
      await (this.hass as any).callService(TODO_DOMAIN, TODO_UPDATE_ITEM, {
        entity_id: entityId,
        item: itemId,
        status: completedItem.status,
        description: newDesc,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async clearCompleted(entityId: string): Promise<boolean> {
    try {
      const items: ShoppingListItem[] = await this.getItems(entityId);
      await Promise.all(items.filter(i => i.status === ShoppingListStatus.Completed).map(async item => {
        const clearedItem: ShoppingListItem = {
          ...item,
          count: 0,
          status: ShoppingListStatus.NeedsAction,
        };
        const newDesc = this.itemToDescription(clearedItem);
        await (this.hass as any).callService(TODO_DOMAIN, TODO_UPDATE_ITEM, {
          entity_id: entityId,
          item: item.id,
          description: newDesc,
          status: clearedItem.status,
        });
      }));
      // Optionally call clear_completed_items if needed
      const availableServices = (this.hass as any).services || {};
      if (
        availableServices[TODO_DOMAIN] &&
        availableServices[TODO_DOMAIN][TODO_CLEAR_COMPLETED]
      ) {
        await (this.hass as any).callService(TODO_DOMAIN, TODO_CLEAR_COMPLETED, {
          entity_id: entityId,
        });
      }
      return true;
    } catch (error) {
      return false;
    }
  }
}