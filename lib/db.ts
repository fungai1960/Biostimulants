// SSR-safe guard: only access PouchDB in browser
const stubDbCache = new Map<string, any>();
const browserDbCache = new Map<string, Promise<any>>();

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export type Doc<T> = T & { _id: string; _rev?: string };

export async function openDB(name: string): Promise<any> {
  if (!isBrowser()) {
    if (!stubDbCache.has(name)) {
      stubDbCache.set(name, {
        async get() { throw new Error('DB unavailable during SSR'); },
        async put() { throw new Error('DB unavailable during SSR'); },
        async remove() { throw new Error('DB unavailable during SSR'); },
        async allDocs() { return { rows: [] } as any; },
        async bulkDocs() { return []; }
      } as any);
    }
    return stubDbCache.get(name);
  }

  if (browserDbCache.has(name)) {
    return browserDbCache.get(name)!;
  }

  const dbPromise = (async () => {
    const mod = await import('pouchdb-browser');
    const PouchDB = (mod as any).default || (mod as any);
    return new PouchDB(name);
  })();

  browserDbCache.set(name, dbPromise);
  return dbPromise;
}

export async function getDoc<T>(db: any, id: string): Promise<Doc<T> | null> {
  try { return await (db as any).get(id); } catch { return null; }
}

export async function upsertDoc<T>(db: any, id: string, data: T): Promise<Doc<T>> {
  const existing = await getDoc<T>(db, id);
  const doc: Doc<T> = { _id: id, ...(existing?._rev ? { _rev: existing._rev } : {}), ...(data as any) } as any;
  await (db as any).put(doc);
  return doc;
}

export async function removeDoc(db: any, id: string): Promise<void> {
  const existing = await getDoc<any>(db, id);
  if (existing) await (db as any).remove(existing);
}

export async function listAll<T>(db: any): Promise<Array<Doc<T>>> {
  const res = await (db as any).allDocs({ include_docs: true });
  return res.rows.map((r: any) => r.doc);
}
