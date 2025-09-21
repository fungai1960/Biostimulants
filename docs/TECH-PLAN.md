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
