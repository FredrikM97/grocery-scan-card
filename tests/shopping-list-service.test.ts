import { describe, it, expect, beforeEach, vi } from "vitest";
import { ShoppingListService } from "../card/services/shopping-list-service";

describe("ShoppingListService", () => {
  let hassMock: any;
  let service: ShoppingListService;

  beforeEach(() => {
    hassMock = {
      services: {
        todo: {
          add_item: true,
        },
      },
      callService: vi.fn(),
      states: {
        "todo.inkopslista": { attributes: { items: ["mjölk"] } },
      },
    };
    service = new ShoppingListService(hassMock);
  });

  it("calls hass.callService with correct parameters", async () => {
    await service.addItem("kök", "todo.inkopslista");
    expect(hassMock.callService).toHaveBeenCalledWith("todo", "add_item", {
      entity_id: "todo.inkopslista",
      item: "kök",
      description: "",
    });
  });

  it("returns false if service is missing", async () => {
    hassMock.services.todo.add_item = undefined;
    const result = await service.addItem("kök", "todo.inkopslista");
    expect(result).toBe(false);
  });

  it("returns false if hass is missing", async () => {
    service = new ShoppingListService(null);
    const result = await service.addItem("kök", "todo.inkopslista");
    expect(result).toBe(false);
  });

  it("gets items from entity", async () => {
    const items = await service.getItems("todo.inkopslista");
    expect(items).toEqual(["mjölk"]);
  });
});
