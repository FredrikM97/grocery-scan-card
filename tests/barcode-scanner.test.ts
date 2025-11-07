import { describe, it, expect } from 'vitest';
import { BarcodeScanner } from '../card/utils/barcode-scanner';

describe('BarcodeScanner', () => {
  it('should instantiate', () => {
    const scanner = new BarcodeScanner();
    expect(scanner).toBeInstanceOf(BarcodeScanner);
  });

  it('should validate barcode', () => {
    const scanner = new BarcodeScanner();
    expect(scanner.isValidBarcode('12345678')).toBe(true);
    expect(scanner.isValidBarcode('abcdefgh')).toBe(false);
    expect(scanner.isValidBarcode('')).toBe(false);
  });
});