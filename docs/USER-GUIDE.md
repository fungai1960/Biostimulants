# Soil Biostimulant Assistant – User Guide

## 1. Getting Started
1. **Open the app**
   - Local development: `npm run dev`, then visit `http://localhost:3000` in Chrome.
   - PWA install: from Chrome DevTools > Application > `Install`, or via the browser install icon.
2. **Language** – use the Lang dropdown (top-right) to switch between available translations (EN/FR/PT).
3. **Navigation** – the home page links to Brew, Inventory, Logs, and Settings. Each page works offline thanks to the built-in PWA.

## 2. Brew / AACT Calculator
1. **On-hand inputs** – add or edit the inventory chips. This tailors substitution suggestions and stage recipes.
2. **Crop stage** – choose Seedling, Veg, Early Flower, or Late Flower.
   - Stage hints adjust dynamically and reflect the new agronomy guidance (carb ranges, humic/fulvic notes).
3. **Batch volume & aloe** – adjust the volume and aloe %, or use the quick presets.
4. **Carbohydrates**
   - Toggle “Include carbohydrates” to enable dose/source controls.
   - Stage defaults auto-suggest (e.g., 3 ml/L in early flower), but manual edits stick even when stage changes.
   - Sources include millet/oat/molasses/other, with unit support for ml/L or g/L.
5. **Surfactant & biostimulant guidance**
   - Yucca availability toggles substitution hints (quillaja, soapwort, aloe) with on-hand indicators.
   - Aloe alternatives are listed when aloe is unavailable.
6. **Protozoa section**
   - Hover or tap the “?” badge for when to brew lucerne tea.
   - Stage-section lists recipes (20 L / 200 L) and brewing notes.
7. **Outputs**
   - “Export Recipe (CSV)” writes to disk.
   - “Copy Recipe” copies a text summary.
   - “Share” uses the browser share API, falling back to copy.
   - “Log this brew” pre-fills the Logs page via the “draft-log” record.
   - The 24h timer persists between sessions; reset/start buttons control it.
8. **Presets**
   - Save the current configuration (includes stage, carbs, availability flags).
   - Applying a preset restores carbohydrates without letting later stage changes override them.

## 3. Inventory
1. **On-hand items** – toggle chips to indicate availability of inputs (yucca, humic, fulvic, etc.).
2. **Favorites** – star frequently used items for quick access.
3. **Search & filters** – use search to filter by name or id.
4. **CSV export** – download a list of on-hand items.
5. **Persistence** – inventory changes save automatically; if storage fails, the red alert appears with retry guidance.

## 4. Logs (Field & Batch)
1. **Draft from brew** – choosing “Log this brew” on Brew page imports recipe notes here.
2. **Adding a log** – enter date, plot/bed, batch notes, application rate, and outcomes. “Add Log” saves locally.
3. **Recent logs** – filter by plot/date, duplicate or delete entries, and export CSV for record keeping.
4. **Offline support** – all logs persist via the local PouchDB and sync only if/when a remote CouchDB is configured later.

## 5. Settings & Backup
1. **Export** – save all data (settings, presets, inventory, logs) as JSON to disk or clipboard.
2. **Import** – drop a JSON file or paste JSON; confirm the overwrite prompt to restore a backup.
3. **Clear data** – the “Danger zone” wipes local storage (useful for resets or browser troubleshooting).
4. **Persistence alerts** – if writes fail (e.g., quota exceeded), a red banner appears; free storage or reload and retry.

## 6. Progressive Web App (PWA)
1. **Install** – use the browser install prompt or DevTools “Application > Install”. Works on desktop and mobile.
2. **Offline** – the service worker caches static assets and images; recipes and logs persist via IndexedDB.
3. **Updates** – when a new build is deployed, the banner prompts “Reload” to fetch the latest assets.

## 7. Deployment Summary (see `docs/DEPLOYMENT.md`)
1. Run `npm run verify` before pushing.
2. `npm run build` ensures production build success.
3. Deploy on Vercel (recommended). Each commit triggers a preview/production build.
4. Tag releases (`git tag v0.1.0`) after production validation.

## 8. Support & Troubleshooting
- **Lint/test failures** – run `npm run verify` to identify problems; fix and rerun.
- **Build errors** – check `npm run build`. Most failures stem from missing client directives or TypeScript types.
- **Translation updates** – edit `i18n/index.ts` (EN/FR/PT) and log reviewer sign-offs in `docs/TECH-PLAN.md`.
- **Lighthouse regression** – re-run Chrome Lighthouse. Keep Performance and PWA scores in the green.

## 9. Roadmap Notes
- External translation review (FR/PT) pending.
- Optional: set up remote sync (CouchDB/Cloudant) once multi-device support is required.
- Optional integration tests (Playwright) for offline/online edge cases.

---
For architecture and deployment details, see `docs/TECH-PLAN.md` and `docs/DEPLOYMENT.md`.
