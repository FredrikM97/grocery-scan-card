/**
 * Product Lookup Module
 * Handles product information retrieval from various sources
 */

interface ProductLookupConfig {
    cache_products?: boolean;
}

class ProductLookup {
    cacheKey: string;
    historyKey: string;
    cacheProducts: boolean;
    cache: Map<any, any>;
    constructor(config: ProductLookupConfig = {}) {
        this.cacheProducts = config.cache_products !== false;
        this.cache = new Map();
        this.historyKey = 'shopping_list_barcode_history';
        this.cacheKey = 'shopping_list_barcode_cache';

        // Load cached data
        this._loadCache();
    }

    async getProductInfo(barcode) {
        // Check local cache first
        if (this.cache.has(barcode)) {
            return this.cache.get(barcode);
        }

        // Fetch from public APIs
        const product = await this._fetchFromPublicAPIs(barcode);
        if (product) {
            this._cacheProduct(barcode, product);
            return product;
        }

        return null;
    }

    async _fetchFromPublicAPIs(barcode) {
        // Try OpenFoodFacts first (better for European products including Swedish stores)
        let product = await this._fetchFromOpenFoodFacts(barcode);
        if (product) return product;

        // Try UPCItemDB as fallback
        product = await this._fetchFromUPCItemDB(barcode);
        if (product) return product;

        return null;
    }

    async _fetchFromOpenFoodFacts(barcode) {
        try {
            const response = await fetch(
                `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
                { timeout: 8000 }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.status === 1) {
                    const product = data.product;
                    return {
                        barcode: barcode,
                        name: product.product_name || 'Unknown Product',
                        brand: product.brands || '',
                        category: product.categories || '',
                        image_url: product.image_url || '',
                        country: product.countries || '',
                        source: 'openfoodfacts'
                    };
                }
            }
        } catch (error) {
            console.warn('OpenFoodFacts API failed:', error);
        }
        return null;
    }

    async _fetchFromUPCItemDB(barcode) {
        try {
            const response = await fetch(
                `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`,
                { timeout: 8000 }
            );

            if (response.ok) {
                const data = await response.json();
                const items = data.items || [];
                if (items.length > 0) {
                    const item = items[0];
                    return {
                        barcode: barcode,
                        name: item.title || 'Unknown Product',
                        brand: item.brand || '',
                        category: item.category || '',
                        image_url: '',
                        country: '',
                        source: 'upcitemdb'
                    };
                }
            }
        } catch (error) {
            console.warn('UPCItemDB API failed:', error);
        }
        return null;
    }

    _cacheProduct(barcode, product) {
        if (!this.cacheProducts) return;

        this.cache.set(barcode, product);

        // Save to localStorage
        try {
            const cacheData = Object.fromEntries(this.cache);
            localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to save cache:', error);
        }
    }

    _loadCache() {
        if (!this.cacheProducts) return;

        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (cached) {
                const cacheData = JSON.parse(cached);
                this.cache = new Map(Object.entries(cacheData));
            }
        } catch (error) {
            console.warn('Failed to load cache:', error);
            this.cache = new Map();
        }
    }

    addToHistory(productName) {
        try {
            const history = this.getHistory();
            const updated = [productName, ...history.filter(item => item !== productName)].slice(0, 50);
            localStorage.setItem(this.historyKey, JSON.stringify(updated));
        } catch (error) {
            console.warn('Failed to save history:', error);
        }
    }

    getHistory() {
        try {
            const history = localStorage.getItem(this.historyKey);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.warn('Failed to load history:', error);
            return [];
        }
    }

    clearCache() {
        this.cache.clear();
        try {
            localStorage.removeItem(this.cacheKey);
            localStorage.removeItem(this.historyKey);
        } catch (error) {
            console.warn('Failed to clear cache:', error);
        }
    }


}

export { ProductLookup };
