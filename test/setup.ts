import '@testing-library/jest-dom';

if (!('matchMedia' in window)) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: () => ({
      matches: false,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

if (!navigator.clipboard) {
  (navigator as any).clipboard = {
    writeText: async () => {},
    readText: async () => '',
  };
}

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = {} as any;
}
if (typeof (globalThis as any).crypto.randomUUID !== 'function') {
  let counter = 0;
  (globalThis as any).crypto.randomUUID = () => `test-uuid-${++counter}`;
}

