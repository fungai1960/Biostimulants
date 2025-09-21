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

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
