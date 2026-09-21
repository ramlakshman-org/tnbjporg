# tnbjp.org — Fix Tasks

**Source:** ISSUES.md (17 confirmed issues, reality-checked against live server 2026-09-19)
**Rule:** One task at a time. Test after each. Never skip ahead.
**Deploy path:** `/var/www/bjptn/backend/` on `168.144.219.177` · PM2 name: `bjptn-backend`

---

## PHASE 1 — Stop the Bleeding
> Zero-risk one-to-three line changes. Can be batched into one deploy.

- [x] **TASK-01** · ISSUE-02 · Remove OTP from plaintext log
  - File: `backend/services/smsService.js:22`
  - Change: Replace full OTP + mobile log line with masked version
  - Test: Send a test OTP, confirm PM2 log shows no OTP or full mobile number
  - Deploy: `pm2 reload bjptn-backend`

- [x] **TASK-02** · ISSUE-16 · Simplify `GET /` response
  - File: `backend/server.js:140-167`
  - Change: Return `{ status: 'ONLINE', version: '1.0.0' }` only
  - Test: `curl https://tnbjp.org/` — confirm no DB names, no API map
  - Deploy: included in Phase 1 batch

- [x] **TASK-03** · ISSUE-06 · Rate limit `/api/check-mobile`
  - File: `backend/server.js` (rate limiter section)
  - Change: Add `checkMobileLimiter` (20 req / 10 min) and apply to `/api/check-mobile`
  - Test: Hit the endpoint 21 times, confirm 429 on 21st
  - Deploy: included in Phase 1 batch

- [x] **TASK-04** · ISSUE-11 · Add `.lean()` to booth voter fetch
  - File: `backend/controllers/adminController.js:1669`
  - Change: Add `.lean()` to `SchemeApplication.find(...).select('epicNo status')`
  - Test: Load booth voter roll in admin panel, confirm data still loads
  - Deploy: included in Phase 1 batch

- [x] **TASK-05** · ISSUE-14 · Invalidate stats cache after `deleteMember`
  - File: `backend/controllers/adminController.js:2184`
  - Change: Add `invalidateStatsCache()` after `User.findByIdAndDelete(userId)`
  - Test: Delete a test member, confirm dashboard stats update immediately
  - Deploy: included in Phase 1 batch

- [x] **TASK-06** · ISSUE-12 · Reject empty schemes array in `registerSchemes`
  - File: `backend/controllers/userChatController.js:359`
  - Change: Replace default fallback array with a 400 error when no schemes provided
  - Test: Call `/api/register-schemes` without schemes field, confirm 400 response
  - Deploy: included in Phase 1 batch

---

## PHASE 2 — Functional Correctness
> Each fix tested individually before moving to the next.

- [x] **TASK-07** · ISSUE-05 · SMS gateway failure must return `success: false`
  - File: `backend/services/smsService.js:36-52`
  - Change: Both `catch` and non-success paths return `{ success: false, error: '...' }`; remove `devOtp` from return
  - Test: Temporarily break the SMS API key, trigger OTP send, confirm controller receives `success: false` and logs the failure
  - Deploy: `pm2 reload bjptn-backend`

- [x] **TASK-08** · ISSUE-10 · Regex scope in CSV/Excel export baseline
  - File: `backend/controllers/adminController.js:1203` and `:1307`
  - Change: Replace exact-string baseline scope with case-insensitive regex for DISTRICT_ADMIN, ASSEMBLY_ADMIN, BOOTH_ADMIN
  - Test: Download CSV as a DISTRICT_ADMIN, confirm row count matches dashboard count
  - Deploy: `pm2 reload bjptn-backend`

- [x] **TASK-09** · ISSUE-13 · Align warm cache payload shape with `getDashboardStats` *(verified: payload already correct — false positive)*
  - File: `backend/controllers/adminController.js:2125-2135`
  - Change: Rewrite `warmStatsCache` payload to match the exact shape `getDashboardStats` returns (`overview`, `districtStats`, `assemblyStats`, etc.)
  - Test: Restart PM2, load super admin dashboard within 30 seconds, confirm stats display correctly
  - Deploy: `pm2 reload bjptn-backend`

- [x] **TASK-10** · ISSUE-03 · Scope check in `updateApplicationStatus`
  - File: `backend/controllers/adminController.js:1048`
  - Change: Replace `findById(id)` with `findOne({ _id: id, ...getAdminScopeQuery(req.admin) })`
  - Test: As BOOTH_ADMIN, attempt to update an application outside your booth — confirm 404. Then update one inside your booth — confirm success.
  - Deploy: `pm2 reload bjptn-backend`

---

## PHASE 3 — Auth Hardening
> Schema change. All existing admin sessions invalidated on deploy. Warn team before deploying.

- [x] **TASK-11** · ISSUE-01 + ISSUE-17 · Add `tokenVersion` to Admin model
  - Files: `backend/models/Admin.js`, `backend/controllers/adminController.js:65` (login), `backend/middleware/authMiddleware.js:58`
  - Changes:
    1. Add `tokenVersion: { type: Number, default: 1 }` to `adminSchema`
    2. In `adminLogin`: increment `admin.tokenVersion` and `await admin.save()` before `generateAdminToken`
    3. `generateAdminToken` already reads `admin.tokenVersion || 1` — works automatically once field exists
    4. `authMiddleware` check already written correctly — works automatically once field exists
  - ⚠️ **All logged-in admins will need to re-login after this deploy**
  - Test: Login as admin, copy JWT, logout, login again — old JWT must be rejected (401)
  - Deploy: `pm2 reload bjptn-backend` · notify all admins before deploying

---

## PHASE 4 — Performance
> No urgency today. Fix before data grows large.

- [ ] **TASK-12** · ISSUE-04 · Excel export — stream via cursor instead of loading all docs
  - File: `backend/controllers/adminController.js:1455`
  - Change: Replace `SchemeApplication.find(...).lean()` with `.lean().cursor()` and `for await`; match existing CSV export pattern
  - Test: Export Excel as SUPER_ADMIN with no filters, confirm file generates correctly and PM2 memory stays flat
  - Deploy: `pm2 reload bjptn-backend`

- [x] **TASK-13** · ISSUE-09 · Replace `distinct('mobile')` with aggregate count
  - File: `backend/controllers/adminController.js:747`
  - Change: Replace `SchemeApplication.distinct('mobile', filter)` with an `$aggregate` `$group` + `$count` pipeline
  - Test: Load admin applications list, confirm pagination total is correct
  - Deploy: `pm2 reload bjptn-backend`

---

## PHASE 5 — Infrastructure
> Nginx config changes. Requires `nginx -t` before reload.

- [ ] **TASK-14** · ISSUE-15 · Remove `unsafe-eval` from nginx CSP
  - File: Live nginx config at `/etc/nginx/sites-enabled/bjptn.conf` (and update `bjptn_nginx.conf` in repo)
  - Change: Remove `'unsafe-eval'` from all 4 location block CSP headers
  - Test: `nginx -t` passes. Load site, check browser console for CSP violations
  - Deploy: `nginx -s reload`

- [x] **TASK-15** · ISSUE-08 · Remove `boothPresidentRoutes` dual mount
  - File: `backend/server.js:175`
  - Change: Remove `app.use('/api/admin', boothPresidentRoutes)` line; move admin-facing endpoints into `adminRoutes.js`
  - Test: All existing `/api/booth-president/*` routes still work; confirm `/api/admin/jurisdictions` no longer responds
  - Deploy: `pm2 reload bjptn-backend`

---

## PHASE 6 — Design Decision Required
> Needs Ram's input on auth flow before implementation.

- [ ] **TASK-16** · ISSUE-07 · Auth on `/api/voter/search-epic` and `/api/validate-epic`
  - **Decision needed:** What level of auth should be required?
    - Option A: Require a verified OTP session (user has completed OTP flow but not necessarily registered)
    - Option B: Require a valid user JWT (user must be a registered member)
    - Option C: Keep unauthenticated but add tighter rate limit (20/10min instead of 30)
  - Once Ram decides: update `voterRoutes.js` and `userChatRoutes.js` accordingly
  - Test: Confirm chatbot flow still works end-to-end after adding auth
  - Deploy: `pm2 reload bjptn-backend`

---

---

## PHASE 7 — New Issues (Comprehensive Re-Audit 2026-09-21)

- [x] **TASK-17** · NEW-01 · HIGH · npm dependency vulnerabilities
  - `brace-expansion` DoS (GHSA-rgw5-rvv9-x895), `qs` + `body-parser` + `express` moderate DoS, `uuid` via `exceljs` moderate
  - Total: 1 high, 5 moderate
  - Fix: `cd /var/www/bjptn/backend && npm audit fix` (non-breaking fixes only)
  - The uuid/exceljs fix requires `--force` (downgrades exceljs to 3.4.0 — breaking) — defer separately
  - Test: `npm audit` shows 0 high after fix
  - Deploy: `pm2 reload bjptn-backend`

- [x] **TASK-18** · NEW-02 · MEDIUM · 43 stale JS bundles in /dist/assets (81MB)
  - Each deploy adds new versioned bundles, old ones never deleted
  - Only the bundle referenced in current `index.html` is needed
  - Fix: Parse `index.html` for referenced filenames, delete everything else in `/dist/assets`
  - Test: Site loads correctly after cleanup
  - Deploy: Static files only — no PM2 reload needed

- [x] **TASK-19** · NEW-03 · MEDIUM · No PM2 log rotation configured
  - `bjptn-backend-error.log` already 1.7MB (waFlow errors), `edm-backend-out.log` 3.2MB
  - PM2 logs grow unbounded — will eventually fill disk
  - Fix: `pm2 install pm2-logrotate` then configure max size 10MB, retain 7 days
  - Test: `pm2 conf pm2-logrotate` shows settings applied
  - Deploy: No PM2 reload needed

- [x] **TASK-20** · NEW-04 · LOW · .env probe requests return HTTP 200 (should be 404)
  - Nginx `try_files` falls back to `index.html` for missing paths — so `/.env`, `/.env.backup` etc. return 200 with SPA HTML
  - Not a real data leak but misleads security scanners and masks detection
  - Fix: Add nginx rule to return 404 for `/.env*` paths before the `try_files` block
  - Test: `curl https://tnbjp.org/.env` returns HTTP 404
  - Deploy: `nginx -t && nginx -s reload`

- [x] **TASK-21** · NEW-05 · LOW · Backup files accessible from web
  - `/index.html.bak` and `/assets/index-C1RDVctI-v2.js.bak` return HTTP 200
  - Fix: Delete `.bak` files from `/var/www/bjptn/dist/`
  - Test: `curl https://tnbjp.org/index.html.bak` returns 404
  - Deploy: Static files only

- [ ] **TASK-22** · NEW-06 · LOW · waFlow RSA error log growing unbounded
  - `[waFlow] decrypt failed` floods error log (~70 errors per 1000 access log entries)
  - Combined with no log rotation (TASK-19), this will eventually fill disk
  - Depends on: TASK-19 (log rotation) mitigates urgency
  - Fix options: (A) Fix RSA key — requires Meta Flow config update; (B) Suppress log noise with a counter instead of per-request error
  - Note: Intentionally deferred in original audit — do NOT fix unless Ram explicitly asks

- [x] **TASK-23** · NEW-07 · INFO · GeoJSON files publicly accessible
  - `tn-assemblies.geojson` (1.4MB) and `tn-districts.geojson` (255KB) served with no auth or cache header
  - Likely intentional for map feature — content is public TN geographic data, not sensitive
  - Improvement: Add long-lived cache header (`Cache-Control: public, max-age=604800`) to reduce bandwidth on repeat loads
  - Deploy: nginx config change + `nginx -s reload`

---

## Progress Tracker

| Task | Issue | Severity | Status | Found | Fixed Date |
|------|-------|----------|--------|-------|------------|
| TASK-01 | ISSUE-02 | CRITICAL | ✅ Done | Audit 1 | 2026-09-19 |
| TASK-02 | ISSUE-16 | LOW | ✅ Done | Audit 1 | 2026-09-19 |
| TASK-03 | ISSUE-06 | HIGH | ✅ Done | Audit 1 | 2026-09-19 |
| TASK-04 | ISSUE-11 | MEDIUM | ✅ Done | Audit 1 | 2026-09-19 |
| TASK-05 | ISSUE-14 | MEDIUM | ✅ Done | Audit 1 | 2026-09-19 |
| TASK-06 | ISSUE-12 | MEDIUM | ✅ Done | Audit 1 | 2026-09-21 |
| TASK-07 | ISSUE-05 | HIGH | ✅ Done | Audit 1 | 2026-09-21 |
| TASK-08 | ISSUE-10 | MEDIUM | ✅ Done | Audit 1 | 2026-09-21 |
| TASK-09 | ISSUE-13 | MEDIUM | ✅ Done | Audit 1 | False positive |
| TASK-10 | ISSUE-03 | CRITICAL | ✅ Done | Audit 1 | 2026-09-21 |
| TASK-11 | ISSUE-01+17 | CRITICAL | ✅ Done | Audit 1 | 2026-09-21 |
| TASK-12 | ISSUE-04 | CRITICAL | ⏸ Deferred | Audit 1 | — |
| TASK-13 | ISSUE-09 | HIGH | ✅ Done | Audit 1 | 2026-09-21 |
| TASK-14 | ISSUE-15 | LOW | ✅ Done | Audit 1 | 2026-09-21 |
| TASK-15 | ISSUE-08 | MEDIUM | ✅ Done | Audit 1 | 2026-09-21 |
| TASK-16 | ISSUE-07 | HIGH | ✅ Done | Audit 1 | 2026-09-21 |
| TASK-17 | NEW-01 | HIGH | ✅ Done | Audit 2 | 2026-09-21 |
| TASK-18 | NEW-02 | MEDIUM | ✅ Done | Audit 2 | 2026-09-21 |
| TASK-19 | NEW-03 | MEDIUM | ✅ Done | Audit 2 | 2026-09-21 |
| TASK-20 | NEW-04 | LOW | ✅ Done | Audit 2 | 2026-09-21 |
| TASK-21 | NEW-05 | LOW | ✅ Done | Audit 2 | 2026-09-21 |
| TASK-22 | NEW-06 | LOW | Deferred | Audit 2 | — |
| TASK-23 | NEW-07 | INFO | ✅ Done | Audit 2 | 2026-09-21 |
