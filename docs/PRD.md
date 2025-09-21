# Product Requirements Document (PRD)

## Product: Soil Biostimulant Assistant (SBA)

## Vision
Enable regenerative market gardeners worldwide to design, brew, and apply biologically driven soil amendments with confidence—on any device, offline-first, with region-aware ingredient substitutions.

## Target Users (Personas)
- Market Gardener (primary): 0.1–5 ha intensive veg/flower operations; needs practical, repeatable recipes and logs.
- Farm Manager (secondary): oversees staff, standardizes SOPs, needs batch tracking and QA.
- Consultant/Educator (secondary): shares templates, analyzes outcomes across farms.

## Core Jobs-To-Be-Done
- Plan and brew teas/AACT based on crop and growth stage.
- Adjust for local ingredient availability (e.g., yucca not available) with functionally equivalent substitutes.
- Calculate dosages, brew times, and application rates, including late-flower carbohydrate strategies.
- Log batches and field applications; track outcomes (chlorophyll/greenness, vigor).
- Operate offline in the field; sync when connection is available.
- Support multiple languages/units.

## MVP Scope
1) Brew & Application Calculator
- Input: batch volume, water quality notes, ingredients on hand.
- Output: ingredient quantities, brew time, temperatures, agitation/aeration guidance, application rates.
- Includes AACT presets (castings, sugars, aeration) and timing (24h typical) with alerts.

2) Stage-Aware Recommendations
- Crop + stage (seedling/veg/early flower/late flower) drives recipe templates (e.g., carb emphasis late-flower).
- Phycocyanin/seaweed/humic-fulvic toggles with rationale.

3) Substitution Engine (Region & Availability)
- If `yucca` unavailable, suggest functionally similar saponin sources (e.g., Quillaja bark, soapwort), including pros/cons and dosages.
- Substitute phycocyanin with seaweed extract or humic/fulvic bundle when needed.
- Maintain traceable rule base with evidence score.

4) Batch & Field Log
- Brew session with timers, notes, photos.
- Application log: plot/bed, rate, weather, simple outcomes.
- Export CSV/JSON.

5) Offline-First PWA
- All core features usable offline; background sync when online.

6) i18n & Units
- English + one additional language at MVP; metric/imperial toggle.

## Out of Scope (MVP)
- Payment/billing, multi-tenant orgs with roles, advanced analytics dashboards, prescriptions by satellite imagery.

## Non-Functional Requirements
- Offline-first with conflict-tolerant sync.
- Accessibility: WCAG 2.1 AA.
- Mobile-optimized UI; desktop-friendly.
- Local privacy by default; explicit opt-in telemetry.
- Performant on low-end Android devices.

## Key Feature Details
- Yucca Availability Constraint: app never hard-depends on yucca; offers substitutes and notes shipping restrictions.
- Aloe Constraint Handling: coach on 5% v/v optimum; warn at >25% v/v as potentially inhibitory.
- Late-Flower Carbohydrate Support: sustained carb inputs guidance; caution against spike/boom-bust.
- Inoculant Strategy: castings baseline; optional targeted Bacillus/AMF module (post-MVP).
- Elemental Cofactors: Mo/Co hints where relevant; educational, not prescriptive in MVP.

## Substitution Logic (Overview)
- Each Ingredient has: FunctionalRoles ["surfactant", "prebiotic", "biostimulant"...], PotencyScore, DosageRange, RegionAvailability[], Substitutes[].
- Rules evaluate: desired Role + RegionAvailability + OnHand -> ranked options with adjusted dosage.

## Success Metrics
- Time-to-batch (min) and steps completed offline.
- Brew/adoption counts per active user.
- % sessions with successful substitution.
- User-reported outcomes (simple 1–5 vigor/greenness) and retention.

## Assumptions
- PWA + wrap to mobile/desktop meets distribution needs.
- Local-first DB with CouchDB-compatible sync is acceptable initially.
- Ingredient availability can be captured coarsely per country/region and refined over time.

## Risks & Mitigations
- Ingredient availability variance: ship with strong substitution engine and localizable datasets.
- Misinuse of concentrates (e.g., aloe): guardrails, warnings, prefilled safe defaults.
- Sync conflicts: use deterministic last-writer-wins with merge UI for critical records.

## Roadmap (High Level)
- MVP (0.1): Core calculators, substitution engine, logs, offline, EN + ES.
- 0.2: Templates library, share/export, basic telemetry (opt-in).
- 0.3: Targeted probiotics/AMF module, trace cofactor helper, more locales.
