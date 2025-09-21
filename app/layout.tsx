import './globals.css';
import type { Metadata } from 'next';
import I18nProvider from './I18nProvider';
import LanguageSwitcher from './LanguageSwitcher';
import SwUpdateBanner from '../components/SwUpdateBanner';

export const metadata: Metadata = {
  title: 'Soil Biostimulant Assistant',
  description: 'Brew, substitute, and apply biologically driven soil amendments',
  manifest: '/manifest.json'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <I18nProvider>
          <div className="max-w-5xl mx-auto p-4">
            <div className="flex justify-end mb-2">
              <LanguageSwitcher />
            </div>
            {children}
          </div>
          <SwUpdateBanner />
        </I18nProvider>
      </body>
    </html>
  );
}
