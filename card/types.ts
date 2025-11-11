// Type definitions for Home Assistant

export interface LovelaceCardConfig {
  type: string;
  title?: string;
  entity?: string;
  [key: string]: any;
}

export interface BarcodeCardConfig extends LovelaceCardConfig {
  title: string;
  enable_camera: boolean;
  cache_products: boolean;
  show_completed: boolean;
}

export interface Product {
  barcode: string;
  name: string;
  brand?: string;
  categories?: string[];
  image?: string;
  nutritionGrades?: string;
  source?: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  completed: boolean;
  barcode?: string;
  count?: number;
  total?: number;
}

// Custom Events
export interface BarcodeScannedEvent extends CustomEvent {
  detail: {
    barcode: string;
  };
}

export interface ProductFoundEvent extends CustomEvent {
  detail: {
    product: Product;
  };
}

export interface ProductAddedEvent extends CustomEvent {
  detail: {
    item: ShoppingListItem;
  };
}
