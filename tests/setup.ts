// Setup file for Vitest: ensure jsdom globals and mock localStorage

// vitest with environment jsdom should provide window/document, but ensure fallbacks
if (typeof globalThis.window === "undefined") {
  // minimal window shim if somehow missing
  // jsdom normally provides this so this is a safety net
  // @ts-ignore
  globalThis.window = globalThis as any;
}

// Provide a simple in-memory localStorage mock if missing
if (typeof globalThis.localStorage === "undefined") {
  const store: Record<string, string> = {};
  // @ts-ignore
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
}

// Ensure window.customCards exists to avoid ReferenceError from editor registration
if ((globalThis as any).window) {
  (globalThis as any).window.customCards =
    (globalThis as any).window.customCards || [];
}

// Ensure global.document points to window.document for older test code
if (
  typeof (globalThis as any).document === "undefined" &&
  (globalThis as any).window
) {
  (globalThis as any).document = (globalThis as any).window.document;
}
