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
