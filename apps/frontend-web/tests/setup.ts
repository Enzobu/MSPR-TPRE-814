import '@testing-library/jest-dom/vitest';

// cmdk observe la liste via ResizeObserver et appelle scrollIntoView : jsdom
// n'implémente ni l'un ni l'autre, on les stub pour éviter un ReferenceError.
globalThis.ResizeObserver ??= class ResizeObserver {
  observe(): void {
    // no-op : cmdk n'a pas besoin d'observation réelle sous jsdom.
  }
  unobserve(): void {
    // no-op
  }
  disconnect(): void {
    // no-op
  }
};

if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom n'expose pas un Storage utilisable selon la config : stub mémoire.
if (
  globalThis.localStorage === undefined ||
  typeof globalThis.localStorage.getItem !== 'function'
) {
  const store = new Map<string, string>();
  const storage: Storage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
  globalThis.localStorage = storage;
}
