import '@testing-library/jest-dom/vitest';

// jsdom n'expose pas un Storage utilisable selon la config : stub mémoire.
if (
  typeof globalThis.localStorage === 'undefined' ||
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
