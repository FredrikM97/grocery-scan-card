import { describe, it, expect } from "vitest";
import { BarcodeCardEditor } from "../card/barcode-card-editor";

describe("BarcodeCardEditor", () => {
  it("should instantiate and set config", () => {
    const editor = new BarcodeCardEditor();
    const config = {
      title: "Test",
      enable_camera: true,
      cache_products: true,
      show_completed: true,
      type: "barcode-card",
      entity: "todo.test",
    };
    editor.setConfig(config);
    expect(editor.config).toEqual(config);
  });
});
