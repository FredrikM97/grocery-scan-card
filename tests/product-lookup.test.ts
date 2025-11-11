import { describe, it, expect, vi } from "vitest";
import { ProductLookup } from "../card/services/product-lookup";

describe("ProductLookup", () => {
  it("should instantiate with default config", () => {
    const lookup = new ProductLookup();
    expect(lookup).toBeInstanceOf(ProductLookup);
    expect(lookup.cacheProducts).toBe(true);
  });

  it("should cache and retrieve product", () => {
    const lookup = new ProductLookup();
    const product = { barcode: "12345678", name: "Test Product" };
    lookup._cacheProduct("12345678", product);
    expect(lookup.cache.get("12345678")).toEqual(product);
  });
});
