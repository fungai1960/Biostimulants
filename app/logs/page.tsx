"use client";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { openDB, listAll, upsertDoc, removeDoc, getDoc } from '../../lib/db';

type Log = {
  id: string;
  date: string; // ISO
  plot: string;
  batchNote: string;
  applicationRate: string;
  outcomes: string; // free text
};

export default function LogsPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<Log[]>([]);
  const [filterPlot, setFilterPlot] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const db = await openDB('sba-logs');
        const docs = await listAll<Log>(db);
        if (mounted) setLogs(docs as any);
      } catch (err) { console.error('Failed to load logs from storage', err); }
    })();
    return () => { mounted = false; };
  }, []);
  const [draft, setDraft] = useState<Log>({ id: '', date: new Date().toISOString().slice(0,10), plot: '', batchNote: '', applicationRate: '', outcomes: '' });
  // Prefill from draft-log if present (one-shot)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const db = await openDB('sba-logs');
        const d = await getDoc<any>(db, 'draft-log');
        if (d && mounted) {
          setDraft({ id: '', date: d.date || new Date().toISOString().slice(0,10), plot: d.plot || '', batchNote: d.batchNote || '', applicationRate: d.applicationRate || '', outcomes: d.outcomes || '' });
          // clear draft after reading
          try { await upsertDoc(db, 'draft-log', { _deleted: true } as any); } catch (err) { console.error('Failed to clear draft log placeholder', err); }
        }
      } catch (err) { console.error('Failed to load draft log from storage', err); }
    })();
    return () => { mounted = false; };
  }, []);

  const add = async () => {
    const id = crypto.randomUUID();
    const next = { ...draft, id };
    setLogs(prev => [next, ...prev]);
    try {
      const db = await openDB('sba-logs');
      await upsertDoc(db, id, next);
    } catch (err) {
      console.error('Failed to save log entry', err);
    }
    setDraft({ id: '', date: new Date().toISOString().slice(0,10), plot: '', batchNote: '', applicationRate: '', outcomes: '' });
  };

  const remove = async (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
    try {
      const db = await openDB('sba-logs');
      await removeDoc(db, id);
    } catch (err) {
      console.error('Failed to delete log entry', err);
    }
  };
  const duplicate = async (l: Log) => {
    const id = crypto.randomUUID();
    const copy: Log = { ...l, id, date: new Date().toISOString().slice(0,10) };
    setLogs(prev => [copy, ...prev]);
    try {
      const db = await openDB('sba-logs');
      await upsertDoc(db, id, copy);
    } catch (err) {
      console.error('Failed to duplicate log entry', err);
    }
  };

  const visible = logs.filter(l => {
    const okPlot = filterPlot ? (l.plot || '').toLowerCase().includes(filterPlot.toLowerCase()) : true;
    const okFrom = filterFrom ? (l.date >= filterFrom) : true;
    const okTo = filterTo ? (l.date <= filterTo) : true;
    return okPlot && okFrom && okTo;
  });

  const exportCsv = () => {
    const header = ['id','date','plot','batchNote','applicationRate','outcomes'];
    const rows = visible.map(l => header.map(h => JSON.stringify((l as any)[h] ?? '')).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `sba-logs-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold mb-1">{t('logs.header')}</h1>
        <p className="text-sm text-gray-600">{t('logs.subheader')}</p>
      </header>

      <section className="p-4 bg-white rounded-md shadow border space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">{t('logs.date')}</label>
            <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('logs.plot')}</label>
            <input value={draft.plot} onChange={(e) => setDraft({ ...draft, plot: e.target.value })} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">{t('logs.batch')}</label>
            <input value={draft.batchNote} onChange={(e) => setDraft({ ...draft, batchNote: e.target.value })} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('logs.rate')}</label>
            <input value={draft.applicationRate} onChange={(e) => setDraft({ ...draft, applicationRate: e.target.value })} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">{t('logs.outcomes')}</label>
            <textarea value={draft.outcomes} onChange={(e) => setDraft({ ...draft, outcomes: e.target.value })} className="w-full border rounded px-3 py-2" rows={3} />
          </div>
        </div>
        <button onClick={add} className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500">{t('logs.add')}</button>
      </section>

      <section className="p-4 bg-white rounded-md shadow border" aria-live="polite">
        <h2 className="font-medium mb-2">{t('logs.recent')}</h2>
        <div className="flex flex-wrap gap-2 mb-3 text-sm">
          <input value={filterPlot} onChange={(e) => setFilterPlot(e.target.value)} placeholder={t('logs.plot') as string} className="border rounded px-2 py-1" />
          <div className="flex items-center gap-1">
            <span>From</span>
            <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="border rounded px-2 py-1" />
          </div>
          <div className="flex items-center gap-1">
            <span>To</span>
            <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="border rounded px-2 py-1" />
          </div>
          <button onClick={exportCsv} className="ml-auto px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500">{t('logs.exportCsv')}</button>
        </div>
        <ul className="divide-y" role="list">
          {visible.map((l) => (
            <li key={l.id} className="py-3 text-sm" role="listitem">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{l.date} — {l.plot}</p>
                  <p className="text-gray-700">{l.batchNote}</p>
                  <p className="text-gray-600">{t('logs.rateShort')}: {l.applicationRate}</p>
                  <p className="text-gray-600">{t('logs.outcomesShort')}: {l.outcomes}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => duplicate(l)} className="h-8 px-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-500">{t('logs.duplicate')}</button>
                  <button onClick={() => remove(l.id)} className="h-8 px-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-500">{t('logs.delete')}</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

