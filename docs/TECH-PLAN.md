# Technical Plan & Architecture

## Approach
- Cross-platform via PWA for web/mobile + desktop wrappers.
- Mobile: Capacitor builds for Android/iOS. Desktop: Tauri for Windows/macOS/Linux.
- Offline-first, local-first database with selective cloud sync.

## Stack
- Frontend: Next.js (App Router) + TypeScript + TailwindCSS + TanStack Query.
- PWA: next-pwa (workbox) with background sync and offline cache.
- State/Data: local-first DB (IndexedDB via PouchDB) + CouchDB/Cloudant compatible remote for sync.
- Packaging: Capacitor (mobile), Tauri (desktop).
- Validation: Zod for schemas and runtime validation.
- i18n: i18next + next-i18next.
- Accessibility: Headless UI + Radix primitives + Axe testing in CI.
- Telemetry: PostHog (self-host option) or OpenTelemetry (opt-in only).

## Key Modules
1) Domain Models (Zod + TypeScript)
- Ingredient, Alternative, Region, RecipeTemplate, Batch, BrewStep, Crop, Stage, ApplicationLog, Inventory, KnowledgeItem, UserPrefs.

2) Substitution Engine
- Rule-based ranking over FunctionalRoles, RegionAvailability, OnHand, Cost, Potency.
- Pluggable knowledge base with source citations and evidence score.

3) Calculators & Timers
- AACT time/temperature/aeration guidance; dosage calculators; late-flower carb strategy.
- Safety guardrails (e.g., aloe <= 5% v/v recommended; warn >25%).

4) Offline & Sync
- PouchDB in browser, replicate to CouchDB-compatible endpoint.
- Conflict strategy: last-write-wins with user-visible merge for critical entities (recipes, logs).

### Local persistence: brew calculator
- IndexedDB database `sba-settings` (via PouchDB) keeps brew form state and presets.
- Document `brew` mirrors the last active form snapshot so offline reloads resume where the user stopped.
- Document `brew-presets` stores an `items` array; each preset contains:
  - `id` and `name` (UI identifier)
  - availability flags: `yuccaAvailable`, `aloeAvailable`, optional `region`
  - form inputs: `aloePercent`, `volumeLiters`, `stage`
  - carbohydrate config: `includeCarbs`, `carbsDoseMlPerL`, `carbsUnit`, `carbsSource`, `carbsSourceKey`
  - entries persist when the user clicks "Save current as preset" and are merged back on apply
- Applying a preset marks carbohydrate fields as user-edited so later stage switches cannot overwrite its saved dosing plan.


5) i18n & Localization
- All copy via translation keys. Metric/imperial conversions. Date/number locale formatting.

6) Packaging & CI/CD
- Web: Vercel/Netlify or static host.
- Mobile: GitHub Actions -> Capacitor builds -> Play Store/TestFlight.
- Desktop: Tauri bundling with code signing.

## Data Privacy & Compliance
- Local by default; opt-in for sync and telemetry.
- Minimal PII (email optional). Comply with GDPR/CCPA: export/delete account.

## Ingredient Availability Strategy
- Region dataset maps ingredient -> availability, restrictions, typical substitutes.
- Yucca: mark low availability regions; suggest Quillaja, soapwort, sarsaparilla root saponins with dosage ranges.

## Testing Strategy
- Unit: substitution engine rules, calculators.
- E2E: Playwright for critical flows offline/online.
- Lint/Typecheck: ESLint + TS.

## Open Questions (to validate during MVP)
- Which cloud sync (Self-host CouchDB vs. Cloudant vs. Supabase) given user base? Start with CouchDB.
- Minimum OS/browser targets for field devices.
## Deployment Checklist
- Run `npm run verify` (lint + unit tests) before packaging.
  - Latest Lighthouse (Chrome, mobile Insights mode, localhost:/logs): Performance 4/4, Accessibility 20/21, Best Practices 6/6, SEO 4/4 (captured 22 Sep 2025).
- Run `npm run build` to ensure Next.js compiles cleanly.
- Capture a Lighthouse PWA report in Chrome DevTools and stash scores alongside release notes.

## Translation Review
- Share updated stage hints and `brew.protozoa` copy (including `protozoaHelp`) with native FR/PT reviewers before release.
- Confirm `common.persistenceError` messaging in both locales aligns with support tone.

