"use client";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function SwUpdateBanner() {
  const { t } = useTranslation();
  const [waitingSW, setWaitingSW] = useState<ServiceWorker | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let mounted = true;

    const onControllerChange = () => {
      // When the new SW takes control, reload to get the latest assets
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!mounted || !reg) return;

      // If there's already an update waiting when we load
      if (reg.waiting) {
        setWaitingSW(reg.waiting);
        setVisible(true);
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New update is ready
            setWaitingSW(reg.waiting || newWorker);
            setVisible(true);
          }
        });
      });
    }).catch((err) => { console.error('Failed to get service worker registration', err); });

    return () => {
      mounted = false;
      try { navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange); } catch (err) { console.error('Failed to remove service worker listener', err); }
    };
  }, []);

  if (!visible) return null;

  const doUpdate = () => {
    try {
      waitingSW?.postMessage({ type: 'SKIP_WAITING' });
      // Fallback: if controller doesn't change shortly, force reload after a brief delay
      setTimeout(() => {
        if (document.visibilityState === 'visible') window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Failed to message waiting service worker', err);
      window.location.reload();
    }
  };

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 bg-gray-900 text-white rounded shadow flex items-center gap-3 border border-gray-700">
      <span className="text-sm">{t('pwa.updateAvailable')}</span>
      <button onClick={doUpdate} className="px-2 py-1 text-sm bg-green-600 hover:bg-green-700 rounded border border-green-700">{t('pwa.reload')}</button>
      <button onClick={() => setVisible(false)} className="px-2 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded border border-gray-600">{t('pwa.dismiss')}</button>
    </div>
  );
}

