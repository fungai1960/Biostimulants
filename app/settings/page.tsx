"use client";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { openDB, listAll, upsertDoc, removeDoc } from '../../lib/db';

type BackupShape = {
  settings: Array<any>;
  logs: Array<any>;
};

export default function SettingsPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>('');
  const [confirmingClear, setConfirmingClear] = useState<boolean>(false);
  const confirmImport = (): boolean => {
    try {
      return window.confirm(t('settings.importConfirm'));
    } catch (err) {
      console.warn('Confirmation prompt unavailable', err);
      return true;
    }
  };

  const buildBackupPayload = async (): Promise<BackupShape> => {
    const settingsDB = await openDB('sba-settings');
    const logsDB = await openDB('sba-logs');
    const settings = await listAll<any>(settingsDB);
    const logs = await listAll<any>(logsDB);
    return { settings, logs };
  };

  const exportAll = async () => {
    try {
      const payload: BackupShape = await buildBackupPayload();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sba-backup-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus(t('settings.exportSavedNote'));
    } catch (e) {
      console.error(e);
    }
  };

  const applyBackup = async (data: BackupShape) => {
    const settingsDB = await openDB('sba-settings');
    const logsDB = await openDB('sba-logs');
    const wipe = async (db: any) => {
      const docs = await listAll<any>(db);
      for (const d of docs) {
        try { await removeDoc(db, d._id); } catch (err) { console.error('Failed to remove document during wipe', err); }
      }
    };
    await wipe(settingsDB);
    await wipe(logsDB);
    for (const d of (data.settings || [])) {
      const { _id, _rev, ...rest } = d || {};
      if (_id) await upsertDoc(settingsDB, _id, rest);
    }
    for (const d of (data.logs || [])) {
      const { _id, _rev, ...rest } = d || {};
      if (_id) await upsertDoc(logsDB, _id, rest);
    }
  };

  const importAll = async (file: File) => {
    try {
      setStatus('');
      if (!confirmImport()) { setStatus(t('settings.importCanceled')); return; }
      const text = await file.text();
      const data = JSON.parse(text) as BackupShape;
      await applyBackup(data);
      setStatus(t('settings.importDone'));
    } catch (e) {
      console.error(e);
      setStatus(t('settings.importError'));
    }
  };

  const exportAllToClipboard = async () => {
    try {
      const payload: BackupShape = await buildBackupPayload();
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setStatus(t('common.copied'));
    } catch (e) {
      console.error(e);
      setStatus(t('settings.importError'));
    }
  };

  const importFromClipboard = async () => {
    try {
      setStatus('');
      let text = '';
      try {
        text = await navigator.clipboard.readText();
      } catch {
        text = window.prompt('Paste JSON here') || '';
      }
      if (!text.trim()) { setStatus(t('settings.pasteError')); return; }
      if (!confirmImport()) { setStatus(t('settings.importCanceled')); return; }
      const data = JSON.parse(text) as BackupShape;
      await applyBackup(data);
      setStatus(t('settings.pasteSuccess'));
    } catch (e) {
      console.error(e);
      setStatus(t('settings.importError'));
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold mb-1">{t('settings.title')}</h1>
        <p className="text-sm text-gray-600">{t('settings.backupDesc')}</p>
      </header>
      <section className="p-4 bg-white rounded-md shadow border space-y-3">
        <div className="flex flex-wrap gap-2">
          <button onClick={exportAll} className="px-3 py-2 border rounded text-sm">{t('settings.exportAll')}</button>
          <button onClick={exportAllToClipboard} className="px-3 py-2 border rounded text-sm">{t('settings.copyAll')}</button>
          <button onClick={importFromClipboard} className="px-3 py-2 border rounded text-sm">{t('settings.pasteAll')}</button>
        </div>
        <div className="text-sm text-gray-700">
          <label className="block mb-1">{t('settings.importAll')}</label>
          <input type="file" accept="application/json,.json" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importAll(f);
          }} />
          <p className="text-xs text-gray-500 mt-1">{t('settings.importHint')}</p>
    <div onDragOver={(e) => { e.preventDefault(); }}
      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) importAll(f); }}
               className="mt-2 p-3 border-2 border-dashed rounded text-xs text-gray-600">
            {t('settings.dropHint')}
          </div>
        </div>
        {status && (
          <p className={`text-xs mt-2 ${status.toLowerCase().includes('failed') ? 'text-red-600' : 'text-green-700'}`}>{status}</p>
        )}
      </section>

      <section className="p-4 bg-white rounded-md shadow border space-y-3">
        <h2 className="font-medium text-sm text-red-700">{t('settings.dangerTitle')}</h2>
        {!confirmingClear ? (
          <button onClick={() => setConfirmingClear(true)} className="px-3 py-2 border rounded text-sm border-red-300 text-red-700 hover:bg-red-50">{t('settings.clearAll')}</button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm">{t('settings.clearAllConfirm')}</span>
            <button onClick={async () => {
              try {
                const settingsDB = await openDB('sba-settings');
                const logsDB = await openDB('sba-logs');
                const wipe = async (db: any) => {
                  const docs = await listAll<any>(db);
                  for (const d of docs) { try { await removeDoc(db, d._id); } catch (err) { console.error('Failed to remove document during wipe', err); } }
                };
                await wipe(settingsDB);
                await wipe(logsDB);
                setStatus(t('settings.cleared'));
              } catch (e) {
                console.error(e);
                setStatus(t('settings.importError'));
              } finally {
                setConfirmingClear(false);
              }
            }} className="px-3 py-2 border rounded text-sm bg-red-600 text-white border-red-700">{t('settings.confirm')}</button>
            <button onClick={() => setConfirmingClear(false)} className="px-3 py-2 border rounded text-sm">{t('settings.cancel')}</button>
          </div>
        )}
      </section>
    </main>
  );
}

