# Soil Biostimulant Assistant (SBA)

Offline‑first PWA to help market gardeners brew and apply biologically driven soil amendments with practical substitutions.

## Prereqs
- Node.js 18+ (LTS): https://nodejs.org

## Quick start (Windows)
```powershell
cd C:\Biostimulants
npm install
npm run dev
```
Open http://localhost:3000

If PowerShell blocks npm, run via:
```powershell
cmd /c npm install
```

## What’s included now
- Brew/AACT calculator with aloe guardrails and surfactant substitutions (GLOBAL by default)
- Stage‑aware recipe templates (per‑L and total amounts)
- Inventory: mark on‑hand inputs (chips); affects suggestions/templates
- Logs: offline field/batch notes with CSV export
- Settings: Export/Import local data (JSON) and Clear all local data
- Offline‑first: service worker in production build

## Carbohydrates (source + dose)
- Toggle carbs on/off in Brew. When enabled, set a carbohydrates dose in ml/L and choose a source.
- Presets: 0.5, 1, 2, 3, 5 ml/L (input clamps to 1–5 ml/L; step 0.5).
- Preferred sources: Pearl millet flour (preferred), Oat flour (original), Molasses (common and accessible).
- Quick source chips available on the Brew page to fill the source field: Pearl millet, Oat flour, Molasses.
- Units auto‑adjust: dry sources use g/L presets (2, 5, 10); liquids use ml/L presets (0.5, 1, 2, 3, 5).
- Late‑flower templates include carbohydrates; the dose you choose is used to compute per‑L and total amounts (automatically clamped to safe ranges with matching units).
- Print header shows whether carbs are included and the selected dose (ml/L).
- A hint is shown to encourage steady carbohydrates and avoiding spikes.

Backup/restore: The carbs dose setting is part of the saved Brew inputs and is included in Settings → Export. Import restores it along with other local settings.

## Backup & restore
- Export: Settings → "Export all data (JSON)" (includes settings, inventory, and logs)
- Import: Settings → "Import data (JSON)" (replaces local data)
- Clear: Settings → "Clear all local data"

## Production build
```powershell
cd C:\Biostimulants
npm run build
npm start
```

## Notes
- Region defaults to GLOBAL; optional override only refines availability hints — it never gates
- Data is stored locally using PouchDB in the browser; no network sync by default
