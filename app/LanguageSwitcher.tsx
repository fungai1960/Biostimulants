"use client";
import { useTranslation } from 'react-i18next';

const languages = [
  { value: 'en', label: 'EN' },
  { value: 'fr', label: 'FR' },
  { value: 'pt', label: 'PT' }
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];

  return (
    <form action="#" className="text-xs">
      <label className="mr-2" htmlFor="lang">Lang</label>
      <select
        id="lang"
        value={current}
        onChange={(e) => { i18n.changeLanguage(e.target.value); }}
        className="border rounded px-2 py-1"
      >
        {languages.map((lang) => (
          <option key={lang.value} value={lang.value}>{lang.label}</option>
        ))}
      </select>
    </form>
  );
}
