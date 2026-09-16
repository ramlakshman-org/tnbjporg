# BJP Nalam Thittam — Task List

---

## TASK 1 — Add 5 New Schemes to the Platform

**Status:** Pending  
**Who:** Super Admin (tnbjp.org)  
**Effort:** ~10–15 min per scheme (if content is ready)

### What to do
1. Login → `tnbjp.org/admin` as Super Admin
2. Go to **Manage Schemes → + Add Scheme**
3. For each scheme, fill:
   - Image (drop any image — auto-resized to 1100×385px)
   - English: Short Name, Full Title, Cluster, Benefit, Overview, Eligibility, How to Apply, Official Link
   - Tamil: same fields in Tamil (all required — blank Tamil = blank content for Tamil-mode users)
4. Hit **Save Changes**
5. New scheme appears in chatbot within 30 seconds — no restart needed

### Schemes to Add
- [ ] Scheme 1 — _name TBD_
- [ ] Scheme 2 — _name TBD_
- [ ] Scheme 3 — _name TBD_
- [ ] Scheme 4 — _name TBD_
- [ ] Scheme 5 — _name TBD_

### Notes
- Current scheme count: **32** (IDs 1–32). New ones will get IDs 33–37 automatically.
- No developer needed. No code change. No deployment.
- If Tamil content is left blank, Tamil-mode users see nothing for that field.
- Have Tamil translations ready before opening the form.

---

## TASK 2 — Sentry Error Tracking Setup

**Status:** ✅ COMPLETED — Sep 12, 2026  
**Who:** Developer (Claude + Ram)  
**Effort:** ~1–2 hours

### What to do
1. Create a Sentry account at sentry.io (if not already)
2. Create two projects: `bjptn-frontend` (React) and `bjptn-backend` (Node.js)
3. Install Sentry SDK in frontend and backend
4. Configure DSN in `.env` files
5. Test with a sample error — confirm it appears in Sentry dashboard
6. Deploy to DO

### What Sentry will track
- Frontend: JS errors, failed API calls, user session context
- Backend: Unhandled exceptions, slow DB queries, OTP failures
- Alerts: Email/Slack notification when a new error hits

### Notes
- Do this before campaign launch (Sep 17) so errors are visible from Day 1
- Will help catch any registration failures silently happening right now
- Free tier (5K errors/month) is enough for current traffic

---

## TASK 3 — Call & WhatsApp Buttons in Referral Dashboard

**Status:** ✅ COMPLETED — Sep 12, 2026 (built and live on tnbjp.org per Ram's decision)
**Who:** Developer (Claude + Ram)  
**Effort:** ~2–3 hours

### Background
Assembly-level party workers register as normal users, share their referral link, and bring people in. In their referral dashboard they can see who registered under them. They want to be able to call or WhatsApp each person directly from that list.

### ⛔ DPDP Act 2023 — Do Not Build Without Legal Clearance

**What was violated if mobile is exposed to assembly workers:**

**Violation 1 — Purpose Limitation (Section 6)**
Mobile numbers were collected for OTP verification only. Displaying them to an assembly worker for calling/WhatsApp is a new, unconsented purpose.

**Violation 2 — Data Sharing Without Consent (Section 7)**
Assembly workers are third parties — not TNBJP staff. Sharing a registrant's mobile with them requires explicit consent from the registrant. No such consent was taken at registration.

**Violation 3 — Data Minimisation (Section 8)**
Even if sharing were justified, exposing full mobile numbers for unsolicited contact goes beyond minimum necessary data.

**Additional risk — Political context**
TNBJP is a political party. Voter mobile numbers shared with party workers for contact = political targeting. Regulators will scrutinise this harder than a regular app. Penalty: up to ₹250 crore per violation under DPDP Act.

**Additional risk — Bulk WhatsApp abuse**
100 workers × 100 contacts = 10,000 WhatsApp messages in one campaign push. WhatsApp detects bulk messaging and bans the sender's number. Workers will blame the app.

**Additional risk — Data leakage**
Worker screenshots dashboard → structured voter name + mobile list walks out permanently. No audit trail.

### Recommendation
**Do NOT add mobile numbers or contact buttons to the user-facing referral dashboard.**

Safe alternative to build instead:
- Keep name + district as-is (no DPDP issue)
- Add scheme application status per referred user ("Applied for X schemes") — useful for worker without exposing PII
- If contact is genuinely needed, route through admin panel where access is controlled and logged

### What needs to change (IF approved after legal clearance)

**L1 — backend `referralController.js`:**
- Add `mobile` to `.select('_id voterName district referralCode mobile')`
- Pass `mobile` through in the `referredMembers` map
- Frontend: add Call (`tel:+91{mobile}`) and WhatsApp (`https://wa.me/91{mobile}`) buttons per L1 row

**L2 — backend `referralController.js`:**
- Replace count-only aggregation with full `.find()` on L2 users
- Select `voterName, district, mobile, referredBy`
- Group under L1 parent, return as `level2Members: [...]` array
- Frontend: render L2 list nested under L1 card with same buttons

**Load strategy (confirmed — Option A):**
100 workers × 100 L1 + ~50 L2 each = ~150 records per dashboard load. Option A (load all upfront) is fine at this scale. No lazy loading needed.

### Notes
- Admin panel showing mobile = safe (admins are accountable fiduciaries)
- User referral dashboard showing mobile = DPDP violation (third party access without consent)
- These are two legally different categories despite looking similar in the UI

---

## TASK 4 — Check Eligibility Feature

**Status:** ✅ COMPLETED — Sep 12, 2026 (live on tnbjp.org)
**Who:** Developer (Claude + Ram)  
**Effort:** ~3–4 hours (frontend only)

### What it does
User opens "Check Eligibility" → sees a checklist of all required documents across all 37 schemes → ticks what they have → system instantly shows which schemes they are eligible for (only when ALL required docs for that scheme are ticked).

### Logic
- AND condition — every doc in a scheme's required list must be ticked
- Partial match = scheme does NOT appear
- Live filter — eligible schemes update as user ticks/unticks
- No new backend API needed — scheme list already loaded from `/api/schemes/list`

### User Journey
1. User opens eligibility checker (button/popup in chatbot)
2. Sees deduplicated list of all documents across all 37 schemes
3. Ticks the documents they currently have
4. Eligible schemes appear in real time
5. User can apply directly from the result

### What Ram needs to provide (BLOCKER)
A clean document list per scheme — e.g.:
```
e-Shram:  [Aadhaar Card, Mobile Number, Bank Account + IFSC]
ABHA:     [Aadhaar Card]
Udyam:    [Aadhaar Card, PAN Card]
PMSBY:    [Aadhaar Card, Bank Account, Bank-registered Mobile]
...
```
Current `documents` field in DB has messy freetext strings — not suitable for exact matching. Ram will provide the authoritative list. Once received, either update DB records or hardcode the matching map in frontend.

### Notes
- This is 100% frontend logic — no new backend endpoint
- Documents should be deduplicated across schemes for the checklist (Aadhaar appears once even if 30 schemes need it)
- Build after Ram provides the clean document list

---

## TASK 5 — Scheme Welfare Card

**Status:** ✅ COMPLETED — Sep 14, 2026  
**Who:** Developer (Claude + Ram)  
**Effort:** ~3–4 hours (frontend only)

### What it does
After a user applies for welfare schemes via tnbjp.org, they get a shareable digital card showing all the schemes they have applied for — branded in BJP Nalam Thittam colors. The card auto-updates whenever they apply for new schemes.

### User Journey
1. User completes registration and applies for schemes
2. Card view appears automatically after registration — "Here is your Welfare Card"
3. Card shows: Name, District, Assembly, all applied schemes (in current language), referral QR code, referral code (NT-XXXXXXXX)
4. User can download as PNG or share directly to WhatsApp
5. At any time later → hamburger sidebar → "My Card" → same card, always showing latest schemes

### Card Content
- **Header:** BJP Nalam Thittam logo + "நலம் திட்டம் — Welfare Card"
- **Schemes section (hero):** All schemes the user has applied for (Tamil or English per language toggle)
- **Footer identity:** Name · District · Assembly
- **Bottom strip:** QR code (links to `tnbjp.org/?ref=NT-XXXXXXXX`) + referral code text
- **Actions:** Download as PNG, Share on WhatsApp

### 0-Scheme State
If user has not applied for any scheme yet → card shows a prompt: "You haven't applied for any schemes yet. Apply now →" (button returns to chat to apply)

### Auto-Update Logic
Card always fetches fresh from `GET /api/schemes/my-requests` on every open. No manual refresh needed — new scheme applied → open card → it's already there.

### Technical Build
| Piece | Details |
|---|---|
| `SchemeWelfareCard` component | New panel in `ChatbotPage.jsx` |
| Data: Name, District, Assembly | `cardRef.current.voter_name`, `profileRef.current.district / assemblyName` |
| Data: Schemes list | `GET /api/schemes/my-requests` (existing endpoint, always fresh) |
| Data: Referral code | `cardRef.current.bjp_code` |
| QR code | `qrcode.react` npm package (client-side) |
| Download PNG | `html2canvas` npm package |
| WhatsApp share | `https://wa.me/?text=...` with referral link |
| Entry point 1 | After registration completes → `setActiveView('my_card')` |
| Entry point 2 | Sidebar nav → "My Card" → `setActiveView('my_card')` |
| Entry point 3 | Left-panel chat items list |

### Notes
- No backend changes needed — all existing APIs
- Language: scheme names follow the current Tamil/English toggle
- `card_url`, `back_url`, `combined_url` fields in `cardRef` are unpopulated backend stubs — not used for this feature
- Two npm installs needed in `frontend/`: `qrcode.react`, `html2canvas`

---

## TASK 6 — Scheme Requests View in Super Admin Dashboard

**Status:** ✅ COMPLETED — Sep 15, 2026
**Who:** Developer (Claude + Ram)  
**Effort:** ~1 hour (frontend only)

### Background
Users can submit free-text scheme suggestions via the "Looking for a scheme not listed here?" box at the bottom of the Schemes view. These are saved to MongoDB (`schemesuggestions` collection) but currently have no visibility in the admin panel — they sit in the DB unseen.

As of Sep 15, 2026: **10 submissions** exist. Investigation found most are "call me" type noise; 1 genuine scheme request ("I need CGTSME"). Admin visibility is needed to triage these.

### What to build
A **"Scheme Requests"** read-only section in the **Super Admin dashboard only** (not district/assembly/booth — they cannot add schemes and cannot act on suggestions).

**Display:**
- Top requested scheme names grouped + counted (e.g. "I need CGTSME — 1 request")
- District breakdown showing where requests are coming from
- Raw list of recent 20–30 submissions: submission text + district + assembly (no mobile, DPDP-safe)

### Why Super Admin only
Only the Super Admin can act on suggestions — they're the one who goes to Schemes Management → Add Scheme. Showing suggestions to district/booth admins who cannot add schemes is noise without action.

### Backend
No new endpoint needed. Add a route: `GET /api/admin/scheme-suggestions` (Super Admin access only) that returns aggregated + raw suggestion data from the `SchemeSuggestion` model.

### Notes
- `SchemeSuggestion` model already exists: stores `suggestion`, `userId`, `mobile`, `epicNo`, `voterName`, `district`, `assemblyName`
- Do NOT display `mobile` in the admin view (DPDP Act 2023)
- This view helps inform which schemes to add next (feeds directly into Task 1)
- Users misusing the box for callback requests ("call me") is a behaviour issue, not a missing feature — no separate callback system needed

---

## SECURITY FIX 3 — check-mobile PII Disclosure

**Status:** ✅ COMPLETED — Sep 16, 2026
**Who:** Developer (Claude + Ram)
**Effort:** ~10 min
**Priority:** HIGH — unauthenticated voter PII enumeration at unlimited rate

### Problem
`POST /api/check-mobile` returned the full user document (voterName, epicNo, district, assemblyName, boothNo, gender, referralCode, referredBy) to any unauthenticated caller with zero rate limiting. 20 sequential requests completed in 2.4 seconds in testing. A political opponent or data harvester with a list of mobile numbers could silently enumerate all BJP registration data for every voter on that list. DPDP Act 2023 exposure.

### Fix
`userChatController.js` — replaced `User.findOne()` returning the full document with `User.exists()` returning a boolean. Response is now `{ registered: true/false }` only. No user data in the response under any circumstance.

Also switched from `findOne` to `exists` — faster (no document projection/transfer), less memory.

### Files changed
- `backend/controllers/userChatController.js` — `checkMobile` function (lines 164–182)

### Test result
`{"success":true,"registered":false}` — no user object, no PII ✅

---

## SECURITY FIX 2 — confirm-registration Account Takeover

**Status:** ✅ COMPLETED — Sep 16, 2026
**Who:** Developer (Claude + Ram)
**Effort:** ~15 min
**Priority:** CRITICAL — full account takeover, exploited live in pen test

### Problem
`POST /api/voter/confirm-registration` (legacy endpoint) looked up the user by `$or [{ mobile: attackerMobile }, { epicNo: victimEPIC }]`. An attacker who verified OTP on their own mobile could supply a victim's EPIC number and receive a valid JWT for the victim's account. Side effect: victim's tokenVersion was incremented, immediately revoking all their active sessions (victim gets logged out as attacker logs in).

**Exploited live during pen test:** attacker mobile `9111111117` + victim EPIC `TESTEPIC001` → server returned victim's token + profile with message "User already registered. Logging in..."

### Fix
Endpoint disabled — returns HTTP 410 Gone immediately. No database queries run. All registration goes through `POST /api/register-schemes` which uses only the verified OTP session mobile and does not have this vulnerability.

### Files changed
- `backend/controllers/voterController.js` — `confirmVoterRegistration` replaced with one-line 410 response

### Test result
`HTTP 410 {"success":false,"message":"This endpoint is no longer available..."}` ✅
Zero real-user traffic on this endpoint (confirmed from nginx logs before fixing).

---

## SECURITY FIX 1 — verify-otp Brute-Force Protection

**Status:** ✅ COMPLETED — Sep 16, 2026
**Who:** Developer (Claude + Ram)
**Effort:** ~1 hour
**Priority:** CRITICAL — confirmed vulnerability, zero protections on live system before fix

### Problem
`POST /api/verify-otp` had zero rate limiting. An attacker who triggered an OTP could hammer all 1,000,000 possible 6-digit codes within the 5-minute OTP window (~16,000 req/min needed — trivial with a script). Confirmed live: 50 sequential requests with an active OTP session returned zero 429s.

### Three-layer fix deployed

**Layer 1 — Per-IP rate limit (`verifyLimiter` in `server.js`)**
10 requests per 10-minute window per IP. Stops single-IP brute force.
`app.use('/api/verify-otp', verifyLimiter)` — wired alongside existing `otpLimiter`, `loginLimiter`, `epicLimiter`.

**Layer 2 — Per-mobile attempt counter (`userChatController.js` + `OtpSession.js`)**
5 wrong OTPs → session immediately deleted. No further guessing possible for that mobile.
`attempts` field added to `OtpSession` schema (default: 0). Counter incremented on every wrong OTP; at 5, `session.deleteOne()` + HTTP 429. Survives distributed attacks (different IPs, same mobile).

**Layer 3 — Existing OtpSession TTL (unchanged)**
MongoDB TTL index expires sessions after 300 seconds regardless. Attacker window was always 5 min; now they get max 5 guesses within it.

### Files changed
- `backend/server.js` — added `verifyLimiter` (lines 120–128), mounted at line 131
- `backend/controllers/userChatController.js` — attempt counter in `verifyOtp` wrong-OTP branch (lines 114–118)
- `backend/models/OtpSession.js` — `attempts` field added to schema (line 29)

### Test results (post-deploy)
- Attempt 1–4: HTTP 400 "Invalid OTP entered" ✅
- Attempt 5: HTTP 429 "Too many incorrect attempts. Please request a new OTP." ✅
- Attempt 6+: HTTP 400 "OTP session expired" (session gone) ✅
- `RateLimit-Limit: 10`, `RateLimit-Policy: 10;w=600` confirmed in response headers ✅

### Attack surface after fix
Attacker must know exact mobile, guess correctly within **5 tries**, within **5 minutes** of OTP dispatch. 1M-guess brute force: closed.

---

## SECURITY FIX 4 — NoSQL Injection (express-mongo-sanitize)

**Status:** ✅ COMPLETED — Sep 16, 2026
**Who:** Developer (Claude + Ram)
**Effort:** ~10 min
**Priority:** LOW — vulnerability was accidentally blocked; this makes protection intentional

### Problem
NoSQL injection (e.g. `{ "$gt": "" }`) was accidentally blocked because `.trim()` throws a TypeError on objects before any MongoDB query ran. Accidental, not architectural. Any endpoint added in future without `.trim()` would be unprotected.

### Fix
Added `express-mongo-sanitize` middleware to `server.js`. Strips `$` and `.` from all request body fields at middleware level, before any controller runs. Protection is now architectural — no longer depends on individual controllers calling `.trim()`.

### Files changed
- `backend/package.json` — added `express-mongo-sanitize` dependency
- `backend/server.js` — `require('express-mongo-sanitize')` + `app.use(mongoSanitize())` after `express.json()`

### Test result
`POST /api/check-mobile` with `{"mobile":{"$gt":""}}` → `BLOCKED` ✅
Middleware strips the `$gt` operator; controller receives sanitized input.

---

## TASK 8 — Tamil Translation Gaps (ChatbotPage)

**Status:** ✅ COMPLETED — Sep 16, 2026
**Who:** Developer (Claude + Ram)
**Effort:** ~1 hour
**Priority:** HIGH — all error messages were showing in English even in Tamil mode

### Problem
Two bugs caused error messages to appear in English regardless of language setting:

1. **Wrong wrap order:** `err?.message || t('fallback')` — when backend returns an error, `err.message` is truthy so `t()` is never called. Fix: `t(err?.message || 'fallback')`.
2. **Key mismatch:** Translation key `"Invalid OTP. Please try again."` didn't match the backend string `"Invalid OTP entered. Please try again."`.

### Fixes applied

**`frontend/src/pages/ChatbotPage.jsx` — 9 locations patched:**
- `sendOtp` catch block
- EPIC search catch block
- Registration catch block
- Referral link unavailable + load error
- Profile load error
- Referred members load error
- Both submit-application handlers (2 functions × 2 catch points)

**`frontend/src/i18n/translations.js` — 11 new Tamil translation keys added:**
- OTP 60s cooldown message
- OTP rate-limit message
- 10-digit phone validation
- Voter DB query failure
- Mobile/EPIC required
- Verification required
- Failed to register schemes
- Failed to submit application
- Referral link unavailable (ℹ️ variant)
- Unable to load referral link (❌ variant)
- (Plus 3 OTP error keys from the earlier partial fix)

### Files changed
- `frontend/src/pages/ChatbotPage.jsx`
- `frontend/src/i18n/translations.js`

### Commits
- `d99240a` — first OTP error fix (deployed earlier)
- `4c999ed` — full audit fix covering all 9 locations + 11 new keys

---

## TASK 9 — Referral-wise Breakdown in Reports

**Status:** ✅ COMPLETED — Sep 16, 2026
**Who:** Developer (Claude + Ram)
**Effort:** ~1 hour
**Priority:** MEDIUM — campaign tracking visibility

### What was built
Minimal, zero-new-query implementation: piggybacked on the existing User bulk lookup that already fires on every Reports page load.

**In-app Reports table** — new "REFERRED BY" column (11th column):
- Shows `NT-XXXXXXXX` referral code for members brought in via referral
- Shows `—` for direct registrations
- No new API endpoint, no new DB queries

**Excel export** — new "Referred By" column L (12th column):
- One additional `User.find()` per export (deduped mobiles, not N+1)
- Title and filter header rows updated to span all 12 columns

### Data verification before building
- 148 total users in DB
- 118/148 (80%) have `referredBy` set
- 118/118 values are `NT-` format codes — zero mobiles, zero EPICs (no PII risk)
- Confirmed from PM2 logs: `[registerSchemes] referredBy=NT-PCGBEHN2` in live registrations

### Files changed
- `backend/controllers/adminController.js` — `referredBy` added to both User bulk lookups in `getApplicationsList`; new User lookup + column L in `exportApplicationsExcel`
- `frontend/src/components/ReportsView.jsx` — `referredBy` added to flatMap, table header, table cell

### Commits
- `878d072` — in-app table column
- `e411b37` — Excel export column

---

## BUG FIX 10 — localStorage SecurityError in WhatsApp WebView

**Status:** ✅ COMPLETED — Sep 16, 2026
**Who:** Developer (Claude + Ram)
**Effort:** ~20 min
**Priority:** CRITICAL — app crashed on load for all users opening referral links from WhatsApp

### Problem
Sentry (`bjptn-frontend` project) caught a `SecurityError: Failed to read the 'localStorage' property from 'Window': Access is denied for this document.` error originating inside React `useState` initializers, at the referral URL `https://www.tnbjp.org/r/NT-YOV4KJN9`. Reported 32+ times as of Sep 15, 2026 (10:16 UTC first occurrence).

**Root cause:** When users tap a shared referral link inside WhatsApp (or any in-app browser), WhatsApp opens it in a restricted WebView that blocks `localStorage` access. `AuthContext.jsx` was calling `localStorage.getItem()` directly inside multiple `useState(() => ...)` initializers with no try/catch. These run synchronously during React's initial render — the SecurityError propagated up, crashed the entire React tree, and the user saw a blank white screen. Campaign's primary sharing channel (WhatsApp referral links) was delivering a broken app.

`utils/api.js` request interceptor also had two unprotected `localStorage.getItem()` calls that would crash any API call in the same restricted environments.

### Fix
Added a `safeLS` helper object in `AuthContext.jsx` that wraps every localStorage operation in try/catch:
```javascript
const safeLS = {
  get: (key) => { try { return localStorage.getItem(key); } catch { return null; } },
  set: (key, val) => { try { localStorage.setItem(key, val); } catch {} },
  remove: (key) => { try { localStorage.removeItem(key); } catch {} },
};
```
Replaced all `localStorage.*` calls in `AuthContext.jsx` (20+ occurrences across `isExpired()`, five `useState` initializers, `loginUser`, `logoutUser`, `loginAdmin`, `logoutAdmin`, inactivity tracker, and the referral capture `useEffect`) with `safeLS.*`.

Also protected the two reads in `utils/api.js` interceptor with individual try/catch blocks.

**Behaviour after fix:** In restricted WebViews, localStorage reads return `null` (user appears logged out — safe fallback). Writes are silently skipped. The app loads and renders normally. Users can register via the referral link without a blank screen.

### Files changed
- `frontend/src/context/AuthContext.jsx` — `safeLS` helper + all localStorage calls replaced
- `frontend/src/utils/api.js` — request interceptor localStorage reads protected

### Commit
- `f7844c5`

---

## TASK 7 — OTP Rate Limiting (Spam & SMS Credit Protection)

**Status:** ✅ COMPLETED — Sep 16, 2026  
**Who:** Developer (Claude + Ram)  
**Effort:** ~30–45 min  
**Priority:** HIGH — must fix before campaign launch

### Problem
`POST /api/send-otp` has no rate limiting. Anyone can call it in a loop with arbitrary mobile numbers, triggering a real SMS via 2Factor API on each call. 10,000 requests = 10,000 SMS credits burned. No special tools needed by the attacker — just a simple script.

Current protections: **None.** The nginx `auth_limit` zone (10 req/min) only covers `/api/auth/` — the OTP endpoint is at `/api/send-otp` which is completely unprotected.

### Two-layer fix

**Layer 1 — nginx rate limit (per IP)**
Add `limit_req` to the `/api/` location in `/etc/nginx/sites-available/bjptn`. Limits each IP to 10 requests/min with a burst of 3. Stops single-IP bot attacks immediately. No code change.

**Layer 2 — Per-mobile cooldown in code**
In `sendOtp` (`backend/controllers/userChatController.js`, line 17), before `OtpSession.create`, check if an OTP was already sent to this mobile in the last 60 seconds. If yes → return HTTP 429.
Uses existing `OtpSession` collection — no new DB table or index needed.

```javascript
// Add after line 31 (after OtpSession.deleteMany)
const recentSession = await OtpSession.findOne({
  mobile: cleanMobile,
  createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
});
if (recentSession) {
  return res.status(429).json({
    success: false,
    message: 'OTP already sent. Please wait 60 seconds before requesting again.'
  });
}
```

### Why two layers
- Attacker from one IP → blocked by nginx (Layer 1)
- Attacker using many IPs targeting the same mobile → blocked by per-mobile cooldown (Layer 2)
- Real user accidentally double-tapping → clear "wait 60 seconds" message (good UX, not confusing error)

### What this does NOT affect
- Normal registration — users naturally wait >60 seconds to receive and type an OTP
- Existing users re-logging in — same flow, same experience

### Files to change
1. `/etc/nginx/sites-available/bjptn` — add `limit_req` to `/api/` location
2. `backend/controllers/userChatController.js` — add 6-line cooldown check after line 31
3. On server: `nginx -t && systemctl reload nginx`
4. On server: SCP updated controller + `pm2 restart bjptn-backend --update-env`

### Test checklist after deploy
- [ ] Call `/api/send-otp` twice within 60 seconds same mobile → second returns 429
- [ ] Call from same IP 10 times rapidly → nginx returns 429 after burst
- [ ] Normal registration end-to-end still works
- [ ] Existing user re-login OTP still works

---
