"use client";
import { useEffect, useMemo, useState } from 'react';
import { listCatalog } from '../../domain/substitution';
import { openDB, getDoc, upsertDoc } from '../../lib/db';
import { useTranslation } from 'react-i18next';

export default function InventoryPage() {
  const { t } = useTranslation();
  const all = useMemo(() => listCatalog(), []);
  const [onHand, setOnHand] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const db = await openDB('sba-settings');
        const doc = await getDoc<any>(db, 'inventory');
        if (mounted) {
          if (Array.isArray(doc?.ids)) setOnHand(doc.ids);
          if (Array.isArray(doc?.favorites)) setFavorites(doc.favorites);
        }
      } catch (err) { console.error('Failed to load inventory from storage', err); }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const db = await openDB('sba-settings');
        await upsertDoc(db, 'inventory', { ids: onHand, favorites });
        setStatus('saved');
      } catch (err) { console.error('Failed to persist inventory', err); }
    })();
  }, [onHand, favorites]);

  const toggle = (id: string) => {
    setOnHand(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const grouped = useMemo(() => {
    const groups: Record<string, { id: string; name: string; roles: string[] }[]> = {};
    for (const i of all) {
      const roles = (i.roles && i.roles.length ? i.roles : ['other']);
      for (const r of roles) {
        if (!groups[r]) groups[r] = [];
        groups[r].push(i);
      }
    }
    return groups;
  }, [all]);

  const pin = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold mb-1">{t('inventory.title')}</h1>
        <p className="text-sm text-gray-600">{t('inventory.subtitle')}</p>
      </header>
      <section className="p-4 bg-white rounded-md shadow border">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-gray-600" aria-live="polite">{status === 'saved' ? t('common.saved') : ''}</div>
          <button onClick={() => {
            const header = ['id','name','roles'];
            const rows = all.filter(i => onHand.includes(i.id)).map(i => [i.id, i.name, (i.roles||[]).join('|')]);
            const csv = [header.join(','), ...rows.map(r => r.map(v => JSON.stringify(v ?? '')).join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `inventory-${new Date().toISOString().slice(0,10)}.csv`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }} className="px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500">{t('inventory.exportCsv') as string || 'Export CSV'}</button>
        </div>
        <div className="mb-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('inventory.search') as string}
                 className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        {favorites.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium text-sm mb-2">{t('inventory.favorites')}</h3>
            <div className="flex flex-wrap gap-2" role="list">
              {favorites.filter(fid => {
                 const i = all.find(x => x.id === fid);
                 if (!i) return false;
                 const q = query.toLowerCase();
                 return !q || i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q);
               }).map(fid => {
                const i = all.find(x => x.id === fid);
                if (!i) return null;
                const active = onHand.includes(i.id);
                return (
                  <div key={i.id} className="flex items-center gap-1">
                    <button onClick={() => toggle(i.id)}
                            className={`px-3 py-1 rounded border text-sm ${active ? 'bg-green-600 text-white border-green-700' : 'bg-white'} focus:outline-none focus:ring-2 focus:ring-green-500`}
                            aria-pressed={active} aria-label={i.name}>
                      {i.name}
                    </button>
                    <button onClick={() => pin(i.id)} className="px-2 py-1 border rounded text-xs" aria-label={`Unpin ${i.name}`}>★</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {Object.entries(grouped).map(([role, items]) => (
          <div key={role} className="mb-4">
            <h3 className="font-medium text-sm mb-2 capitalize">{role}</h3>
            <div className="flex flex-wrap gap-2" aria-label={t('inventory.toggleHint')} role="list">
              {items.filter(i => {
                const q = query.toLowerCase();
                return !q || i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q);
              }).map(i => {
                const active = onHand.includes(i.id);
                const isFav = favorites.includes(i.id);
                return (
                  <div key={i.id} className="flex items-center gap-1">
                    <button onClick={() => toggle(i.id)}
                            className={`px-3 py-1 rounded border text-sm ${active ? 'bg-green-600 text-white border-green-700' : 'bg-white'} focus:outline-none focus:ring-2 focus:ring-green-500`}
                            aria-pressed={active} aria-label={i.name}>
                      {i.name}
                    </button>
                    <button onClick={() => pin(i.id)} className={`px-2 py-1 border rounded text-xs ${isFav ? 'bg-yellow-300' : ''}`} aria-label={`${isFav? 'Unpin':'Pin'} ${i.name}`}>☆</button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

