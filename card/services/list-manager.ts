/**
 * Shopping List Manager Module
 * Handles interaction with Home Assistant shopping list
 */
class ShoppingListManager {
    private hass: any;
    
    constructor(hass: any) {
        this.hass = hass;
    }

    async addItem(name: string, entityId: string, description = ''): Promise<boolean> {
        try {
            const availableServices = this.hass.services || {};
            const serviceName = 'todo';
            const serviceAction = 'add_item';

            if (!(availableServices[serviceName] && availableServices[serviceName][serviceAction])) {
                // Service not available — signal a specific error so the caller can show a helpful message
                const err: any = new Error('Todo service not available');
                err.code = 'NO_TODO_SERVICE';
                throw err;
            }

            await this.hass.callService(serviceName, serviceAction, {
                entity_id: entityId,
                item: name,
                description
            });

            console.log(`Successfully added "${name}" to shopping list using ${serviceName}.${serviceAction} for entity ${entityId}`);
            return true;
        } catch (error) {
            console.error('Failed to add item to shopping list:', error);
            // Re-throw so callers can differentiate missing service vs other failures
            throw error;
        }
    }

    async getItems(entityId: string) {
        try {
            const entity = this.hass.states[entityId];
            console.log('Available entities:', Object.keys(this.hass.states).filter(key => key.includes('shopping') || key.includes('todo')));
            console.log('Shopping list entity:', entity);
            if (entity) {
                return entity.attributes.items || [];
            }
            return [];
        } catch (error) {
            console.error('Failed to get shopping list items:', error);
            return [];
        }
    }

    async toggleComplete(itemId: string, entityId: string): Promise<boolean> {
        try {
            const availableServices = this.hass.services || {};
            if (availableServices['todo'] && availableServices['todo']['update_item']) {
                await this.hass.callService('todo', 'update_item', {
                    entity_id: entityId,
                    item: itemId,
                    status: 'completed'
                });
                return true;
            } else {
                throw new Error('Todo service not available. Enable the Todo integration.');
            }
        } catch (error) {
            console.error('Failed to toggle item completion:', error);
            return false;
        }
    }

    async removeItem(itemId: string, entityId: string): Promise<boolean> {
        try {
            const availableServices = this.hass.services || {};
            if (availableServices['todo'] && availableServices['todo']['remove_item']) {
                await this.hass.callService('todo', 'remove_item', {
                    entity_id: entityId,
                    item: itemId
                });
                return true;
            } else {
                throw new Error('Todo service not available. Enable the Todo integration.');
            }
        } catch (error) {
            console.error('Failed to remove item:', error);
            return false;
        }
    }

    async clearCompleted(entityId: string): Promise<boolean> {
        try {
            const availableServices = this.hass.services || {};
            if (availableServices['todo'] && availableServices['todo']['clear_completed_items']) {
                await this.hass.callService('todo', 'clear_completed_items', {
                    entity_id: entityId
                });
                return true;
            } else {
                throw new Error('Todo service not available. Enable the Todo integration.');
            }
        } catch (error) {
            console.error('Failed to clear completed items:', error);
            return false;
        }
    }

    formatProductDescription(product) {
        if (!product) return '';

        const parts = [];

        if (product.brand) {
            parts.push(`Brand: ${product.brand}`);
        }

        if (product.barcode) {
            parts.push(`Barcode: ${product.barcode}`);
        }

        if (product.source) {
            parts.push(`Source: ${product.source}`);
        }

        return parts.join(' | ');
    }
}

export { ShoppingListManager };
