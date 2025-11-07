// Barcode formats for native BarcodeDetector
export const BARCODE_FORMATS = [
  'ean_13', // EAN-13 (13 digits, retail)
  'ean_8',  // EAN-8 (8 digits, small packages)
  'upc_a',  // UPC-A (12 digits, US retail)
  'upc_e',  // UPC-E (8 digits, compressed UPC-A)
  'code_128', // Code 128 (alphanumeric, logistics)
  'code_39'   // Code 39 (alphanumeric, industry)
];

// Readers for QuaggaJS
export const QUAGGA_READERS = [
  'ean_reader',      // EAN-13
  'ean_8_reader',    // EAN-8
  'code_128_reader', // Code 128
  'code_39_reader',  // Code 39
  'upc_reader',      // UPC-A
  'upc_e_reader'     // UPC-E
];
