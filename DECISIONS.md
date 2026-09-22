# Decisions

## 2026-09-22 — TASK-26: Optional EPIC / No-EPIC registration path

**Bug fix:** Removed `if (!cleanEpic) return 400` guard in `volunteerRegister` (`boothPresidentController.js`) that blocked registrations without a Voter ID. The PND- placeholder fallback already existed but was unreachable.

**Feature:** Users can now register using district + assembly (no EPIC). System stores `epicNo: "PND-{mobile}"` as a placeholder satisfying MongoDB `required: true`. All scheme applications use this PND- epicNo.

**EPIC update flow:** Moved from chatbot login prompt → My Profile page. Users with a PND- EPIC see an "Add Your Voter ID" card in My Profile. On successful EPIC verification, `User.epicNo` is overwritten with verified voter data (name, district, assembly, booth), and all scheme applications are cascade-updated via `SchemeApplication.updateMany()`.

**Deployed files:**
- `/var/www/bjptn/backend/controllers/boothPresidentController.js` (removed EPIC guard, Sep 22 08:51)
- `/var/www/bjptn/dist/assets/index-DZ1sPKcj-v2.js` (TASK-26 frontend build, Sep 22)

**E2E verified:**
- New user (no EPIC): Mobile → OTP → District/Assembly → Confirm → Schemes → PND- placeholder stored ✓
- Returning PND- user: Login → My Profile → Add EPIC → Voter DB lookup → overwrite → cascade update ✓
- Original EPIC-first flow: completely unchanged ✓
- DB post-update: epicNo IOR0578971, voterName Achutharaman, SchemeApplication cascaded ✓

**Restarts:** pm2 reload bjptn-backend (4 cluster workers), all online, 23 total restarts (all from prior TASK-25 crash-loop, none new).

---

## 2026-09-22 — Comprehensive E2E Health Check

**All systems healthy as of 09:35 UTC:**
- PM2: 7 processes online — bjptn-backend (4 workers, 42m uptime), bjp-localbody-backend (6d), edm-backend (6d), vanigan-backend (6d)
- CPU: 1.3% | RAM: 50.4% | Disk: 6% (8.2G/154G)
- SSL: valid to Dec 9 2026
- MongoDB Atlas: CONNECTED (app_db + voter_db), 196 users, 499 scheme apps, 10 volunteers, 1 PND- user
- `/api/health` (direct port 5000): `{"status":"OK","databases":{"app_db":"CONNECTED","voter_db":"CONNECTED"}}`
- `/api/schemes/list`: 32 schemes ✓
- `/api/booth-president/jurisdictions`: 39 districts ✓
- `/api/update-epic` (no auth): 401 ✓
- `/api/send-otp` (bad input): 400 ✓
- Live site https://tnbjp.org: frontend loading, Tamil UI, scheme sidebar, chatbot all rendering ✓
- Other apps (bjp-localbody, edm-backend, vanigan-backend): 0 errors, 0 restarts ✓

**Known non-blocking issue:**
- Historical SyntaxError (`adminController.js:2440 exportAnalyticsExcel`) still in PM2 error log — remnant from TASK-25 crash-loop. Not actively crashing; workers stable since last reload. Recommend fixing separately.

**Domain note:** tnbjp.org (not .com) — nginx vhost `server_name tnbjp.org www.tnbjp.org tamilnadubjp.live www.tamilnadubjp.live`

---

## 2026-09-16 — Welfare card scheme overflow

PERF: Welfare card — unrestricted scheme titles exceeded the fixed portrait panel and were clipped → display up to six complete titles, measured against the available panel height, with a translated remaining-application count and a link to My Schemes → 20 local Chromium scenarios passed across English/Tamil, 360px/1440px widths, and 0/1/6/7/23 applications with long names and locations. Actual PNG downloads were generated and visually checked in both languages. Text sharing retains all applications. No backend or registration changes.

- Production build: passed (existing large-bundle warning).
- Regression harness: `frontend/tests/welfare-card.html`, `welfare-card.jsx`, and `welfare-card.cjs`; run with a local Vite server on port 3100 and an installed Playwright module (or `PLAYWRIGHT_MODULE` override). Fixtures use synthetic data and mocked scheme endpoints; they are excluded from the production build.
- Deployment: copy hashed frontend assets first and replace `index.html` last; preserve the previous entry point and assets for rollback. No process restart required.
- Released at 2026-09-16 13:36 UTC to `tnbjp.org`. Public HTML and JavaScript SHA-256 values matched the tested local build. `/api/health` reported both databases connected; all PM2 processes stayed online with unchanged restart counts. Previous build: `/var/www/bjptn/dist_backup_welfare_card_20260916`.
