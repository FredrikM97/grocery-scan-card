// Setup file for Vitest: mock localStorage and document

if (typeof window !== 'undefined') {
  if (!window.localStorage) {
    let store = {};
    window.localStorage = {
      getItem: key => store[key] || null,
      setItem: (key, value) => { store[key] = value.toString(); },
      removeItem: key => { delete store[key]; },
      clear: () => { store = {}; }
    };
  }
}

if (typeof global !== 'undefined' && !global.document) {
  global.document = window.document;
}
