# Deployment & Release Guide

## Hosting Choice: Vercel vs Netlify
- **Vercel**: first-class Next.js support, zero-config previews, handles App Router/PWA/ISR out of the box.
- **Netlify**: framework-agnostic; requires additional Next.js adapters for ISR/PWA. Use when consolidating mixed stacks.

**Recommendation**: Deploy to Vercel for this Next.js/PWA project.

## Pre-Deploy Checklist
1. Run `npm run verify` (lint + tests).
2. Run `npm run build` locally to catch build-time issues (ensures .next bundle ready).
3. Capture Chrome Lighthouse (Insights/mobile) scores for / and /logs routes.
4. Update `docs/TECH-PLAN.md` with the Lighthouse snapshot and translation review status (done – see // lines 70 & 75).

## GitHub & Vercel Workflow
1. Commit and push main branch
   ```bash
   git add .
   git commit -m "Finalize brew release prep"
   git push origin main
   ```
2. In Vercel: New Project → import `fungai1960/Biostimulants`.
   - Build command: `npm run build`
   - Output directory: `.next`
   - Environment variables: none required yet.
3. Verify Vercel deploy preview → promote to production.
4. Optional: Tag release
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

## Post-Deploy Smoke Test
- Visit `https://<project>.vercel.app/`.
- Check brew/inventory/logs pages, offline mode (DevTools → Application → Offline), and service worker status.
- Install PWA on desktop/mobile.

## External Translation Review
- Provide FR/PT reviewers with updated stage hints, `brew.protozoa`, `protozoaHelp`, and `common.persistenceError` strings.
- Record sign-off in `docs/TECH-PLAN.md`.
