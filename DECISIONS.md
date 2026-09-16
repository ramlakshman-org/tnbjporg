# Decisions

## 2026-09-16 — Welfare card scheme overflow

PERF: Welfare card — unrestricted scheme titles exceeded the fixed portrait panel and were clipped → display up to six complete titles, measured against the available panel height, with a translated remaining-application count and a link to My Schemes → 20 local Chromium scenarios passed across English/Tamil, 360px/1440px widths, and 0/1/6/7/23 applications with long names and locations. Actual PNG downloads were generated and visually checked in both languages. Text sharing retains all applications. No backend or registration changes.

- Production build: passed (existing large-bundle warning).
- Regression harness: `frontend/tests/welfare-card.html`, `welfare-card.jsx`, and `welfare-card.cjs`; run with a local Vite server on port 3100 and an installed Playwright module (or `PLAYWRIGHT_MODULE` override). Fixtures use synthetic data and mocked scheme endpoints; they are excluded from the production build.
- Deployment: copy hashed frontend assets first and replace `index.html` last; preserve the previous entry point and assets for rollback. No process restart required.
- Released at 2026-09-16 13:36 UTC to `tnbjp.org`. Public HTML and JavaScript SHA-256 values matched the tested local build. `/api/health` reported both databases connected; all PM2 processes stayed online with unchanged restart counts. Previous build: `/var/www/bjptn/dist_backup_welfare_card_20260916`.
