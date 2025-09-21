import { describe, expect, it, vi } from 'vitest';

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;

describe('openDB', () => {
  it('returns a stub when window is undefined', async () => {
    const mod = await import('../../lib/db');

    Object.defineProperty(globalThis, 'window', { value: undefined, configurable: true });
    Object.defineProperty(globalThis, 'document', { value: undefined, configurable: true });

    const db = await mod.openDB('ssr-test');
    await expect(db.allDocs()).resolves.toEqual({ rows: [] });
    await expect(db.put({} as any)).rejects.toThrow('DB unavailable during SSR');

    Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true });
    Object.defineProperty(globalThis, 'document', { value: originalDocument, configurable: true });
  });

  it('creates a PouchDB instance in browser context', async () => {
    vi.resetModules();
    class MockPouch {
      public name: string;
      constructor(name: string) {
        this.name = name;
      }
    }
    vi.doMock('pouchdb-browser', () => ({ default: MockPouch }));

    const mod = await import('../../lib/db');
    const db = await mod.openDB('browser-test');
    expect(db).toBeInstanceOf(MockPouch);

    vi.doUnmock('pouchdb-browser');
  });
});
