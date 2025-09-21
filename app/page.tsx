"use client";
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function Home() {
  const { t } = useTranslation();
  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">{t('app.title')}</h1>
      <p className="text-sm text-gray-700 mb-6">{t('app.tagline')}</p>
      <section className="space-y-3">
        <div className="p-4 rounded-md bg-white shadow border">
          <h2 className="font-medium">{t('home.startBrew')}</h2>
          <p className="text-sm text-gray-600">{t('home.brewDesc')}</p>
          <Link href="/brew" className="inline-block mt-2 text-sm text-green-700 hover:underline">{t('app.nav.brew')}</Link>
        </div>
        <div className="p-4 rounded-md bg-white shadow border">
          <h2 className="font-medium">{t('home.inventory')}</h2>
          <p className="text-sm text-gray-600">{t('home.inventoryDesc')}</p>
          <Link href="/inventory" className="inline-block mt-2 text-sm text-green-700 hover:underline">{t('app.nav.inventory')}</Link>
        </div>
        <div className="p-4 rounded-md bg-white shadow border">
          <h2 className="font-medium">{t('home.subs')}</h2>
          <p className="text-sm text-gray-600">{t('home.subsDesc')}</p>
        </div>
        <div className="p-4 rounded-md bg-white shadow border">
          <h2 className="font-medium">{t('settings.title')}</h2>
          <p className="text-sm text-gray-600">{t('settings.backupDesc')}</p>
          <Link href="/settings" className="inline-block mt-2 text-sm text-green-700 hover:underline">{t('app.nav.settings')}</Link>
        </div>
        <div className="p-4 rounded-md bg-white shadow border">
          <h2 className="font-medium">{t('home.logs')}</h2>
          <p className="text-sm text-gray-600">{t('home.logsDesc')}</p>
          <Link href="/logs" className="inline-block mt-2 text-sm text-green-700 hover:underline">{t('app.nav.logs')}</Link>
        </div>
      </section>
    </main>
  );
}
