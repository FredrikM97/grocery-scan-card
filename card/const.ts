export const SUPPORTED_BARCODE_FORMATS = ["qr_code", "code_128", "ean_13", "code_39", "upc_a"];
export const TODO_CALL_SERVICE = "call_service";
export const TODO_GET_ITEMS = "get_items";
export const SHOPPING_LIST_REFRESH_EVENT = "shopping-list-global-refresh";
// Barcode formats for native BarcodeDetector
export const BARCODE_FORMATS = [
  "ean_13", // EAN-13 (13 digits, retail)
  "ean_8", // EAN-8 (8 digits, small packages)
  "upc_a", // UPC-A (12 digits, US retail)
  "upc_e", // UPC-E (8 digits, compressed UPC-A)
  "code_128", // Code 128 (alphanumeric, logistics)
  "code_39", // Code 39 (alphanumeric, industry)
];

// Readers for QuaggaJS
export const QUAGGA_READERS = [
  "ean_reader", // EAN-13
  "ean_8_reader", // EAN-8
  "code_128_reader", // Code 128
  "code_39_reader", // Code 39
  "upc_reader", // UPC-A
  "upc_e_reader", // UPC-E
];

// Service and domain constants
const TODO_DOMAIN = "todo";
const TODO_ADD_ITEM = "add_item";
const TODO_UPDATE_ITEM = "update_item";
const TODO_CLEAR_COMPLETED = "clear_completed_items";
export { TODO_DOMAIN, TODO_ADD_ITEM, TODO_UPDATE_ITEM, TODO_CLEAR_COMPLETED };