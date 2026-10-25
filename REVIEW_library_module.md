# Library Module — Deep Analysis (`librarian-updates`)

**Date:** 2026-10-10 · **Branch:** `librarian-updates` @ `e89c6cf` · **Origin commit:** `b5934cb` ("library api integration" — sole library commit)
**Scope:** Full stack — server module, DB schema, API contract, hooks, views, wiring, auth, tests.
**Method:** Read every library file end-to-end (server: schema/routes/controller/service/repository; DB tables; `api/library.ts`; all 11 hooks; key views + `home.tsx` container; auth middleware); cross-checked field-by-field across the 5 layers.

---

## 1. Architecture Map

```
DB (drizzle, 11 tables)          Server (/api/v1/library)              Client
─────────────────────────        ──────────────────────────            ─────────────────────────────
library_categories                routes.ts (38 endpoints)              api/library.ts (591 lines)
library_authors                   controller.ts (408 ln, zod parse)     features/librarian/hooks/* (11)
library_books                     service.ts  (791 ln, business rules)  features/librarian/components/* (21)
library_book_copies               repository.ts (609 ln, drizzle)       app/(librarian)/home.tsx (874 ln —
library_loans                     auth: authenticate | requireStaff     single container for ALL tabs)
library_reservations                                                      types/index.ts, utils/pdfGenerator.ts
library_fines
library_payment_transactions
library_question_papers
library_settings
```

- **Domain coverage:** books/catalog (titles, categories, authors, physical copies w/ accession+barcode), circulation (issue/return/renew), fines (overdue auto-fine, damage fines, partial payment, waivers), members (students from `users`), PYQ archive, per-institution settings, dashboard/reports, PDF report export (refactored to shared module in `e89c6cf`).
- **Auth:** GETs = `authenticate` (any logged-in role); mutations = `requireStaff` (`admin|hod|principal|teacher`).
- **UI:** single-tab-switcher screen (`home.tsx`) + 21 components; sidebar with dashboard/categories/books/circulation/fines/members/PYQs/reports/settings/profile/announcements.

## 2. Critical Findings (P0 — feature-breaking)

### LIB-1 · Every paginated list is permanently empty (`data` vs `items`)
Server returns `{ data: [...], total }`; every hook reads `res.items`:
- `library.service.ts:119` → `{ data: enrichedBooks, total, ... }` (same shape for loans `:308`, fines `:523`, PYQs via repo, members via repo)
- `api/client.ts:69` unwraps one level → client receives `{ data: [...], total }`
- `useLibraryBooks.ts:24`, `useLibraryLoans.ts:25`, `useLibraryFines.ts:25`, `useLibraryMembers.ts:20`, `useLibraryPYQs.ts:26` → `res?.items || []` → **always `[]`, total 0**

**Impact:** Books, circulation, fines, members, PYQ screens all show empty states despite healthy data. Dashboard (fed from these arrays in `LibrarianDashboardView`) shows all-zero KPIs. This is the single biggest integration break.
**Fix:** one-line per hook (`res?.data ?? res?.items ?? []`) or — better — normalize server list shape to `items` once.

### LIB-2 · The librarian role cannot write anything
`auth.ts:198` — `requireStaff` allows only `['admin','hod','principal','teacher']`. Role `librarian` exists in the app (`features/shared/constants/roles.ts:10`, route guards, whole portal) but **every POST/PUT/DELETE on `/library/*` returns 403 for a librarian**. Only an admin can manage the library.
**Fix:** add `'librarian'` to `requireStaff` (or introduce `requireLibraryStaff = requireRole('admin','librarian')` for library routes).

### LIB-3 · Issue-book always fails validation (even for admin)
`app/(librarian)/home.tsx:327` sends `bookCopyId: copyId`; server `IssueBookSchema` (`library.schema.ts:96–103`) requires **`copyId`**. Zod strips the unknown key → `copyId` missing → 400 `VALIDATION_ERROR` on every issue attempt.
**Fix:** send `copyId` (and optionally `customDays`) from the container.

### LIB-4 · Members show institution type as "class"
`library.repository.ts:576` and `:599` map `classSection: users.institutionType`. The `users` table has no class column (classes live in `student_classes`/`class_sections`); `institutionType` holds `'school'`/`'college'`. Every member card displays e.g. "school" as their class.
**Fix:** join `student_classes`/`class_sections` (or the user's class lookup used elsewhere in the app).

### LIB-5 · Return confirmation always claims "zero fines"
Server returns `{ loan, fine, fineAmount }` (`library.service.ts:453`); client reads `res.fineCreated` (`home.tsx:344`, `api/library.ts:459`). `fineCreated` doesn't exist → the "overdue fine generated" alert never shows, even when a fine row was created.

## 3. Major Findings (P1)

### LIB-6 · `OVERDUE` loan status is dead — dashboard overdue count is always 0
Nothing ever writes `status: 'OVERDUE'` (no cron, no lazy flip). Loans past due remain `ACTIVE`. But `getDashboardStats` counts `l.status === 'OVERDUE'` (`library.service.ts:768`) → always 0. The PDF generator already works around this (`pdfGenerator.ts:111`: `ACTIVE && dueDate < today`). Same for fines outstanding display assumptions.
**Fix:** compute overdue as `status IN (ACTIVE) AND dueDate < today` (SQL) or run a daily flip job.

### LIB-7 · Client↔server contract drift in `api/library.ts` (stale types)
The UI modals mostly send correct keys, but the declared types are fiction — they hide real mismatches (LIB-3/5) and would mislead the next caller:

| Area | Client declares | Server/DB actually |
|---|---|---|
| `IssueBookPayload` | `bookCopyId`, `notes` | `copyId`, `issueDate`, `dueDate`, `customDays` |
| `ReturnBookPayload` | `returnCondition`, `notes` | `condition`, `returnDate` |
| `PayFinePayload` | `paymentMode?`, `notes` | `paymentMethod` **required** enum + `cashTendered`, `changeReturned`, `transactionRef`, `scannedQrPayload` |
| `WaiveFinePayload` | `reason` only | `reason` **+** `remarks` (both required) |
| `CreateDamageFinePayload` | `fineType: 'DAMAGE'|'LOST'`, `reason` | `damageType` (9-value enum), `damageNotes`, `copyCondition/Status` |
| `CreatePYQPayload` | `examType?`, `fileSize` | `examType` **required**, `totalMarks`, `durationMinutes`; no `fileSize` column |
| `CreateBookPayload` | `authors?: string` | `authorIds: string[]` (authors silently dropped) |
| `CreateCategoryPayload` | `parentCategoryId` | `parentId` (hierarchy silently dropped) |
| `LibraryLoan` | `issuedAt`, `returnedAt`, `notes` | `issueDate`, `returnDate` (date cols); no notes |
| `LibraryFine` | `copyId`, `reason`, `dueDate` | `bookCopyId`, `damageType`+`damageNotes`; no dueDate |
| `LibraryPaymentTransaction` | `paymentMode`, `recordedBy`, `studentId` | `paymentMethod`, `cashier`; has `receiptNo`, `cashTendered` (missing client-side) |
| `LibraryBook` | `authors?: string`, `pages`, `shelfLocation` | `authorIds: jsonb`; no pages/shelf cols |
| `LibraryBookCopy` | `purchaseDate`, `price`, `vendor`, `notes` | `rack`, `shelf`, `addedAt` |
| `LibraryCategory` | `parentCategoryId` | `parentId` |
| `LibraryAuthor` | `biography` | `bio` |
| `getMemberApi` returns | `{member, activeLoans, borrowingHistory, fines}` | `{member, activeLoansCount, totalLoansCount, loans, fines, reservations}` |
| Dashboard stats | `totalFinesAmount`, `unpaidFinesAmount`, `recentFines` | `totalFinesCollected`, `totalFinesOutstanding`; no recentFines |

**Fix:** regenerate `api/library.ts` from the zod schemas/DB records; treat it as the single typed contract.

### LIB-8 · Privacy hole — any student can read the whole institution's library data
GET `/library/loans`, `/fines`, `/members`, `/members/:id` are `authenticate`-only (`library.routes.ts:70,76,93–94`). A student token can list every loan, every fine, and the full member directory (names, emails, phones, admission numbers). Catalog reads (books/categories/PYQs) are reasonably open; **loans/fines/member PII must be staff-only** (or student-scoped: `studentId = self`).

### LIB-9 · Ignored filters (silent no-ops)
- `LoanQuerySchema.search` → parsed, passed to service, **never applied** in `library.repository.ts:269–295`.
- `FineQuerySchema.search` → same (`:365–390`).
- `MemberQuerySchema.classSection` → never applied (`:548–588`).
UIs that expose search boxes on these screens filter nothing server-side (and client-side filtering of a broken empty list does nothing).

### LIB-10 · N+1 queries + full-table loads (will not scale past a demo)
- `listLoans` (`library.service.ts:291–306`): loads **all books**, then 2 queries **per loan** (copy + member).
- `listFines` (`:497–521`): 4 queries **per fine** (member, transactions, copy, book).
- `listCategories` (`:25–33`): loads **all books** to compute `bookCount` (should be one `GROUP BY`).
- `getDashboardStats` (`:757–788`): loads all books, copies, loans, fines, members — no aggregates; `recentLoans` are **raw rows** (no book/student names, unlike listLoans enrichment).
- `getMemberDetails` (`:741`): loads **all reservations** then filters in JS.
- PDF generators receive the same unpaginated dumps from the UI.

### LIB-11 · Random ID generation races against unique indexes
- Accession/barcode: `ACC-${Math.floor(100000+Math.random()*900000)}` per copy (`library.service.ts:162–164`) — collision → 500 from `uq_lib_copies_inst_accession/barcode`, no retry.
- Receipt No: `REC-${random}` (`:558`) vs `uq_lib_txns_receipt` — same.
**Fix:** deterministic sequence (per-institution counter) or retry-on-conflict; receipts should be sequential/transactional.

### LIB-12 · Currency inconsistency: hard-coded `$` in an Indian-school product
Fine-lock message (`library.service.ts:353`), payment errors (`:544,549`), and modals (`PayFineModal`, `DamageFineModal`, `WaiveFineModal` alerts) all use `$`, while payment methods include `UPI_ONLINE`/`SCANNER_QR` and every other module (fees, announcements PDFs) uses `₹`. Settings defaults (`finePerDay 1.00`, `maxFine 100`) are currency-agnostic numerics — display layer must switch to `₹`/`formatINR`.

### LIB-13 · Zero test coverage
`server/tests` contains no library tests (the 24 green vitest tests cover announcements). Issue→return→fine→pay→waive is the most stateful flow in the app and is completely unverified — which is exactly how LIB-1/3/5 shipped.

## 4. Minor Findings (P2)

| ID | Finding | Evidence |
|---|---|---|
| LIB-14 | Dashboard hero shows hardcoded date **"Monday, 19 Sep 2026"** and mojibake quote `“oA library is a universe...` | `LibrarianDashboardView.tsx:47,51` |
| LIB-15 | Dead settings: `allowReservation`, `reservationExpiryDays`, `openingHours/closingHours/openOnWeekends`, `lostBookPenalty`, `damagedBookPenalty` are stored/editable but **never enforced or used** (damage fine amount is manual input) | schema `:185–200`, service never reads them |
| LIB-16 | Reservations: table + repo methods exist; **no routes, no UI** — only surface is inside `getMemberDetails` | `library.routes.ts` (none), `library.service.ts:741` |
| LIB-17 | PYQ `fileUrl` defaults to a W3C dummy PDF; no upload endpoint — "upload" is a URL string; download tracking is a bare counter | `library.service.ts:677` |
| LIB-18 | `deleteBook`/`deleteCopy` remove copies but leave loans/fines history orphaned (no FK restrict, no cascade policy) | `library.service.ts:212–218,272–279` |
| LIB-19 | `renewBook` allows renewing an already-overdue loan with no fine at renew time and no fine-lock check (issue blocks on unpaid fines, renew doesn't) | `library.service.ts:457–486` |
| LIB-20 | `payFine` has no concurrency guard (two parallel payments can over-credit before status flips) | `:526–590` |
| LIB-21 | `useLibraryDashboard` fetched in `home.tsx:85` but `LibrarianDashboardView` computes KPIs from the (empty) list arrays instead — `dashboardStats` is only used for refresh nudges | `home.tsx:85,318–321` |
| LIB-22 | Issue view builds a fake local loan (`id: loan-${Date.now()}`, `issuedBy: 'lib-user'`) then the parent re-sends a real request — double bookkeeping, confusion risk | `IssueBookView.tsx:150–165` + `home.tsx:323–337` |
| LIB-23 | `returnBook` fine math uses `Math.ceil` on ms diff of date-only strings — off-by-one risk around DST/timezones (dates parsed as UTC midnight) | `library.service.ts:405–407` |
| LIB-24 | No student/teacher-facing catalog, borrow-status, or PYQ screens — module is librarian-only despite GETs being world-readable | `features/student/**` (no library refs) |
| LIB-25 | `listMembers` exposes `email`/`phone` to the librarian UI without need; fine for staff, but combined with LIB-8 it's the PII at risk | `library.repository.ts:573–574` |

## 5. What Works Well

- **Zod schemas are thorough** — sensible limits (500), coercions, defaults, damage-type/enum coverage; validation-first controller pattern is consistent.
- **Business rules that exist are right:** ISBN/accession/barcode uniqueness checks with tenancy, borrowing limit + unpaid-fine lock before issue, grace period + max-fine capping on return, renewal limit, partial payments with cash-tendered/change, waiver requires category + justification, category delete blocked while in use.
- **DB design is solid:** partial unique index `uq_lib_loans_active_copy` (belt-and-braces vs the app-level check), receipt/accession/barcode unique indexes, numeric(10,2) money columns, per-institution scoping everywhere, `ON DELETE` book-copy checks before delete.
- **Tenancy checks on every single-record read** (case-insensitive institution-code compare throughout the service).
- **Transactions** wrap issue/return/pay/damage flows (loan+copy, fine+transaction stay consistent).
- **PDF export** (post-`e89c6cf`) is clean: shared `pdfShared.ts`, real KPIs, N4 audit fix, B7 ≥90% top-performer filter, B4 stable receipt numbers, B3 no fake data.
- **UI breadth is impressive for one commit:** 21 components covering catalog CRUD, copy management, issue/return/renew with member+book search, 3 fine modals, PYQ archive with preview, settings form, sidebar/header/profile, announcements integrated.

## 6. Fix Plan (recommended order)

**Wave 1 — make the portal actually function (½ day):**
1. LIB-1: normalize list shape (`res.data`/`res.items` — pick one, fix 5 hooks).
2. LIB-2: add `librarian` to `requireStaff` (or library-specific role gate).
3. LIB-3: `home.tsx:327` `bookCopyId` → `copyId`.
4. LIB-5: read `res.fine`/`res.fineAmount` (drop `fineCreated`).
5. LIB-12: replace `$` with `₹` in service messages + fine modals.

**Wave 2 — correctness & privacy (1 day):**
6. LIB-8: staff-gate `/loans`, `/fines`, `/members` (keep catalog GETs open).
7. LIB-4: real class-section join for members.
8. LIB-6: overdue computed from `dueDate < today` (dashboard + list filter).
9. LIB-9: implement `search` in loans/fines repos + `classSection` in members.
10. LIB-7: regenerate `api/library.ts` from server schemas (kills the drift class of bug).

**Wave 3 — scale & hygiene (as needed):**
11. LIB-10: replace N+1/full loads with joins + `GROUP BY` counts + SQL aggregates for dashboard.
12. LIB-11: sequence-based accession/receipt numbering with retry.
13. LIB-13: vitest coverage for issue→return→fine→pay→waive + tenancy + limit/lock rules.
14. P2 backlog: LIB-14 (live date + fix mojibake), LIB-15/16 (implement or remove reservations/hours), LIB-17 (real PYQ upload), LIB-18 (history retention policy), LIB-19 (fine-lock on renew).

## 7. Evidence Log

- Read in full: `library.schema.ts` (228), `library.routes.ts` (99), `library.controller.ts` (408), `library.service.ts` (791), `library.repository.ts` (609), `api/library.ts` (591), `api/client.ts` (75), all 11 librarian hooks, `home.tsx` (first 370 lines incl. all API handlers), `IssueBookView`/`PayFineModal`/`WaiveFineModal`/`DamageFineModal`/`PYQsView` payload sections, `LibrarianDashboardView` (head), `auth.ts` (207), library DB tables (drizzle `schema.ts:398–~640`).
- Cross-checks: greps for `OVERDUE` writes (none), `stats.` reads, `fineCreated`, `bookCopyId`, `requireStaff` roles, student-side library refs (none), library tests (none).
- Git: library module introduced entirely by `b5934cb`; no subsequent commits touched it until this review.

*Companion reports:* `REVIEW_librarian-updates.md` (announcements + PDF fix integration), `REVIEW_principal-hod.md` (dashboard branch portals).
