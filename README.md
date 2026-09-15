# SchoolHub — Unified School & College ERP System

A modern, comprehensive School and College ERP application built with **React Native**, **Expo**, **TypeScript**, and **Zustand**.

---

## 🚀 Key Modules & Feature Highlights

- 🎓 **Student Portal** (`app/(student)/home.tsx`): Attendance rings, live period tracker, homework submissions, fee dues, bus tracker, library access, and placement hub.
- 💼 **Placement & Career Management** (`app/placement.tsx`): Manageable recruitment drives, multi-stage application pipeline (*Applied → Shortlisted → Interview → Offered*), recruiter CRM, and CTC package analytics.
- 📚 **Library Management System** (`app/(librarian)/home.tsx`): Book inventory & digital E-Books, circulation desk, automated fine calculation (₹5/day), live gatekeeper footfall, barcode scanner simulation, No-Dues clearance generator, and in-app reminders.
- 💰 **Finance & Accounts Ledger** (`app/(accountant)/home.tsx`): Income & fee collections, operating expense logs, staff payroll disbursement slips, bus fleet transport maintenance, and accounts tally.
- 👨‍👩‍👧 **Parent Portal** (`app/(parent)/home.tsx`): Real-time ward attendance, academic progress, digital fee payments, circulars, and live GPS bus tracking.
- 🛡️ **Administrator Hub** (`app/(admin)/home.tsx`): Role-based access control, user provisioning (self-registration is disabled for security), and master system settings.

---

## 🔑 Demo Login Credentials

All demo accounts share the standard password `admin123`. 1-tap login shortcuts are available on the sign-in screen:

| Role | Email | Password | Primary Dashboard |
|---|---|---|---|
| **Admin** | `admin@school.com` | `admin123` | [`app/(admin)/home.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/app/(admin)/home.tsx) |
| **Placement Officer / Admin** | `admin@school.com` | `admin123` | [`app/placement.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/app/placement.tsx) |
| **Librarian** | `librarian@school.com` | `admin123` | [`app/(librarian)/home.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/app/(librarian)/home.tsx) |
| **Accountant / Finance** | `accountant@school.com` | `admin123` | [`app/(accountant)/home.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/app/(accountant)/home.tsx) |
| **Teacher / Faculty** | `teacher@school.com` | `admin123` | [`app/(teacher)/home.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/app/(teacher)/home.tsx) |
| **Parent** | `parent@school.com` | `admin123` | [`app/(parent)/home.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/app/(parent)/home.tsx) |
| **Student** | `student@school.com` | `admin123` | [`app/(student)/home.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/app/(student)/home.tsx) |

---

## 🛠️ Development & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Expo Development Server
```bash
npx expo start -c
```
- Press `w` to open in browser (Web).
- Press `a` for Android emulator or scan QR code in Expo Go app.
- Press `i` for iOS simulator.

### 3. Verify TypeScript Compilation
```bash
npx tsc --noEmit
```

---

## 🗑️ Complete Deprecated & Deleted Files Reference

For all collaborators comparing current branch releases with earlier commits or the base `main` branch, here is the complete historical record of removed/consolidated files and their current replacements:

### 1. UI Routes & Navigation
| Deleted File | Reason for Removal / Consolidation | Current Active Replacement |
|---|---|---|
| `app/(tabs)/_layout.tsx` | Default Expo boilerplate tab bar | Replaced by role-scoped folder routing (`app/(student)/*`, `app/(parent)/*`, etc.) |
| `app/(tabs)/explore.tsx` | Default Expo boilerplate tab | Replaced by feature modules (`app/placement.tsx`, `features/librarian/*`) |
| `app/(tabs)/index.tsx` | Default Expo boilerplate home tab | Replaced by dedicated role-scoped home dashboards |
| `app/admin-login.tsx` | Legacy separate admin login route | Unified into single multi-role portal [`app/auth.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/app/auth.tsx) |
| `app/teacher-login.tsx` | Legacy separate teacher login route | Unified into single multi-role portal [`app/auth.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/app/auth.tsx) |
| `app/dev-login.tsx` | Legacy developer login route | Unified into single multi-role portal [`app/auth.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/app/auth.tsx) |
| `app/home1.tsx` | Legacy temporary test home screen | Consolidated into official role dashboards |
| `app/admin-profile.tsx` | Redundant profile screen | Consolidated into `app/(student)/profile.tsx` and role profile sheets |
| `app/profile.tsx` | Redundant root profile screen | Replaced by `app/(student)/profile.tsx` |

### 2. Components, Hooks & Scripts
| Deleted File | Reason for Removal / Consolidation | Current Active Replacement |
|---|---|---|
| `features/auth/components/AuthBypassButtons.tsx` | Insecure demo bypass buttons | Disabled self-registration; enforced Firebase Admin user provisioning |
| `components/Logo.tsx` | Static image component | Replaced with vector brand icons in headers (`StudentHomeHeader`, etc.) |
| `scripts/verify-features.ts` | Temporary scratch script | Replaced with official scripts in [`server/scripts/seedTestAccounts.ts`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/server/scripts/seedTestAccounts.ts) |
| `hooks/useAppSync.ts` | Root hooks directory consolidation | Standardized under [`features/shared/hooks/useAppSync.ts`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/shared/hooks/useAppSync.ts) |
| `hooks/usePushNotifications.ts` | Root hooks directory consolidation | Standardized under [`features/shared/hooks/useAppSync.ts`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/shared/hooks/useAppSync.ts) |

### 3. Early Documentation & Static Specs
| Deleted Files / Folders | Reason for Removal | Current Active Replacement |
|---|---|---|
| `.agents/rules/*.md` (15 files) | Early development workflow rules | Consolidated into active repository code architecture |
| `docs/*.md` (12 files) | Static conceptual design documents | Replaced with live TypeScript definitions & [`CHANGELOG.md`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/CHANGELOG.md) |
| `specs/*.md` (3 files) | Preliminary feature specifications | Replaced by typed feature models in `features/*/types/` |
| `PHASE1.md` | Legacy phase-1 checklist | Replaced by [`CHANGELOG.md`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/CHANGELOG.md) |

---

## 📖 Architecture & Changelog

For the complete architectural migration guide and module-by-module additions, please refer to:
👉 **[`CHANGELOG.md`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/CHANGELOG.md)**
