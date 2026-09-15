# Project Changelog & Architecture Comparison Guide

This document provides a detailed breakdown of all **Added**, **Modified**, and **Deleted/Deprecated** files comparing the current feature branches (`feature/placement`, `feature/library`) with the baseline `main` branch. It serves as a single source of truth for all collaborators working on the codebase.

---

## 1. Summary of Changes Across Branches

| Category | Count | Key Highlights |
|---|---|---|
| **Added Files** | 42+ | Complete Placement Engine, Finance Ledger, Library Gatekeeper/Circulation, Parent Portal, Server Seed Scripts |
| **Modified Files** | 20+ | Unified Authentication (Admin-provisioned), Role-based Home Dashboards, Type Definitions, Academics API |
| **Deleted/Consolidated** | 12+ | Legacy multi-login routes, default Expo starter tabs, redundant mock scripts, unverified bypass buttons |

---

## 2. Deleted & Consolidated Files Log (With Rationale)

Collaborators should review these deletions to understand why they were removed and where their functionality now resides:

| Deleted / Deprecated File | Rationale & Replacement |
|---|---|
| `app/(tabs)/_layout.tsx`<br>`app/(tabs)/explore.tsx`<br>`app/(tabs)/index.tsx` | **Removed**: Default Expo starter tabs. **Replacement**: Replaced with dedicated, role-scoped routing directories: `app/(student)/home.tsx`, `app/(parent)/home.tsx`, `app/(accountant)/home.tsx`, `app/(librarian)/home.tsx`, and `app/(admin)/home.tsx`. |
| `app/admin-login.tsx`<br>`app/dev-login.tsx`<br>`app/teacher-login.tsx` | **Consolidated**: Legacy separate login screens. **Replacement**: Unified into a single secure authentication gateway in [`app/auth.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/app/auth.tsx) with automatic role detection and 1-tap demo credentials. |
| `features/auth/components/AuthBypassButtons.tsx` | **Removed**: Insecure demo bypass mechanism. **Replacement**: Enforced Firebase auth and admin-provisioned login IDs. Self-registration is strictly disabled. |
| `app/admin-profile.tsx`<br>`app/profile.tsx` | **Consolidated**: Duplicate profile routes. **Replacement**: Standardized to `app/(student)/profile.tsx` and role-scoped profile screens. |
| `scripts/verify-features.ts` | **Removed**: Temporary local scratch verification script. **Replacement**: Official server scripts added under [`server/scripts/seedTestAccounts.ts`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/server/scripts/seedTestAccounts.ts). |
| `hooks/useAppSync.ts`<br>`hooks/usePushNotifications.ts` | **Consolidated**: Legacy root hooks. **Replacement**: Moved and modularized into [`features/shared/hooks/useAppSync.ts`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/shared/hooks/useAppSync.ts). |
| `components/Logo.tsx` | **Consolidated**: Replaced with vector brand icons in headers (`StudentHomeHeader`, `AccountantHeader`, `PlacementHeader`, etc.). |

---

## 3. Added Files by Feature Module

### A. Placement Management Module (`features/placement/` & `app/placement.tsx`)
- [`app/placement.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/app/placement.tsx): 5-tab Placement & Career Management Hub.
- [`features/placement/types/placement.ts`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/placement/types/placement.ts): TypeScript models (`JobDrive`, `CandidateApplication`, `CompanyPartner`, `PlacementOffer`).
- [`features/placement/store/usePlacementStore.ts`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/placement/store/usePlacementStore.ts): Centralized Zustand store for recruitment drives, application pipelines, offers ledger, and CTC analytics.
- [`features/placement/components/PlacementHeader.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/placement/components/PlacementHeader.tsx): Header with quick metrics and active drive indicators.
- [`features/placement/components/PlacementOverviewView.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/placement/components/PlacementOverviewView.tsx): Executive KPI dashboard (Placement rate %, Highest package, Average CTC, Total Offers).
- [`features/placement/components/PlacementDrivesView.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/placement/components/PlacementDrivesView.tsx): Manageable campus drives with add/edit modals, package configuration, and eligibility filters.
- [`features/placement/components/CandidatePipelineView.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/placement/components/CandidatePipelineView.tsx): Multi-stage candidate funnel (*Applied → Shortlisted → Interview Scheduled → Offered → Rejected*) with 1-tap shortlist and interview scheduler.
- [`features/placement/components/CompanyDirectoryView.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/placement/components/CompanyDirectoryView.tsx): Recruiter CRM with direct phone/email actions.
- [`features/placement/components/PlacementOffersLedgerView.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/placement/components/PlacementOffersLedgerView.tsx): Official offer certificates and salary breakdown ledger.
- [`features/student/components/StudentPlacementModal.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/student/components/StudentPlacementModal.tsx): Student self-service career portal for 1-tap eligibility verification and application tracking.

### B. Library Management Module (`features/librarian/` & `app/(librarian)/home.tsx`)
- [`features/librarian/types/library.ts`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/librarian/types/library.ts): Models for `Book`, `BorrowedBook`, `LibraryEntryExitLog`, `LibraryFine`, `BookReservation`, `LibraryClearanceCertificate`, and `InAppLibraryReminder`.
- [`features/librarian/store/useLibraryStore.ts`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/librarian/store/useLibraryStore.ts): Full library lifecycle store (borrowing, return with ₹5/day fine, gatekeeper occupancy, reservation queues, in-app reminder alerts).
- [`features/librarian/components/BookCatalogView.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/librarian/components/BookCatalogView.tsx): Inventory management with stock meters and digital E-Book tags.
- [`features/librarian/components/BorrowingRegisterView.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/librarian/components/BorrowingRegisterView.tsx): Circulation desk with 1-tap renewal, fine collection/waiver, and in-app overdue notification dispatch.
- [`features/librarian/components/LibraryGatekeeperView.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/librarian/components/LibraryGatekeeperView.tsx): Live library occupancy gatekeeper with check-in/check-out duration logging.
- [`features/librarian/components/LibraryFinesLedgerView.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/librarian/components/LibraryFinesLedgerView.tsx): Fine collection ledger synced with central Accounts store.
- [`features/librarian/components/LibraryBarcodeScannerModal.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/librarian/components/LibraryBarcodeScannerModal.tsx): Simulated digital barcode & QR accession code scanner.
- [`features/librarian/components/LibraryClearanceModal.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/librarian/components/LibraryClearanceModal.tsx): Official No-Dues clearance validator and certificate generator.
- [`features/student/components/StudentLibraryModal.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/student/components/StudentLibraryModal.tsx): Student portal for borrowed books, digital reading, hold queue placement, and in-app library alerts.

### C. Finance & Accounts Module (`features/accountant/` & `app/(accountant)/`)
- [`features/accountant/types/finance.ts`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/accountant/types/finance.ts): Finance ledger models (`IncomeTransaction`, `ExpenseTransaction`, `StudentFeeRecord`, `FleetVehicle`).
- [`features/accountant/store/useFinanceStore.ts`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/accountant/store/useFinanceStore.ts): Double-entry ledger state, fee collection, payroll disbursement, fleet transport, and tally analytics.
- [`features/accountant/components/IncomeManagementView.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/accountant/components/IncomeManagementView.tsx): Fee income and miscellaneous receipts.
- [`features/accountant/components/ExpenseManagementView.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/accountant/components/ExpenseManagementView.tsx): Vendor payments and operating expenses.
- [`features/accountant/components/PayrollExpensesView.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/accountant/components/PayrollExpensesView.tsx): Staff salary slips and disbursement records.
- [`features/accountant/components/FleetTransportView.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/accountant/components/FleetTransportView.tsx): School bus fleet maintenance, fuel logs, and driver details.
- [`features/accountant/components/AccountsTallyView.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/accountant/components/AccountsTallyView.tsx): Financial balance sheet and profit & loss summary.

### D. Parent Portal Module (`features/parent/` & `app/(parent)/home.tsx`)
- [`app/(parent)/home.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/app/(parent)/home.tsx): Parent dashboard with 5-tab cockpit.
- [`features/parent/components/ParentOverviewView.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/parent/components/ParentOverviewView.tsx): Ward academic overview and quick actions.
- [`features/parent/components/ParentAttendanceView.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/parent/components/ParentAttendanceView.tsx): Real-time attendance calendar and absence alerts.
- [`features/parent/components/ParentFeesView.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/parent/components/ParentFeesView.tsx): Fee invoices and digital receipts.
- [`features/parent/components/ParentBusTrackerView.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/parent/components/ParentBusTrackerView.tsx): Live bus GPS route tracking and ETA.
- [`features/parent/components/ParentNoticesView.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/parent/components/ParentNoticesView.tsx): School circulars and exam schedules.

### E. Server & Database Scripts (`server/scripts/`)
- [`server/scripts/seedTestAccounts.ts`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/server/scripts/seedTestAccounts.ts): Seeds demo accounts for all roles (`admin`, `accountant`, `librarian`, `teacher`, `parent`, `student`) in Firebase Authentication.
- [`server/scripts/seedFirestoreUsers.ts`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/server/scripts/seedFirestoreUsers.ts): Seeds Firestore user profile documents.
- [`server/scripts/setCustomClaims.ts`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/server/scripts/setCustomClaims.ts): Assigns Firebase Admin custom claims.

---

## 4. Modified & Enhanced Files

- [`app/auth.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/app/auth.tsx): Disabled self-registration per school security policy; added 1-tap demo credentials for all 6 roles.
- [`app/(student)/home.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/app/(student)/home.tsx): Added direct entry cards for Central Library and Placements Hub.
- [`features/admin/components/AdminHomeModulesGrid.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/admin/components/AdminHomeModulesGrid.tsx): Added Placements module routing.
- [`features/admin/components/AdminUsersView.tsx`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/features/admin/components/AdminUsersView.tsx): Upgraded user management table for admin user provisioning.
- [`api/academics.ts`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/api/academics.ts): Enhanced timetable and attendance mock/API connectors.

---

## 5. Collaborator Compliance & Merge Guide

When merging branches into `main` or synchronizing feature branches:

1. **Verify Type Compliance**:
   ```bash
   npx tsc --noEmit
   ```
   *Ensure 0 compile/type errors before committing.*

2. **Branch Overview**:
   - `feature/placement`: Placement engine, corporate directory, application pipeline, offer ledger.
   - `feature/library`: Digital library circulation, barcode scanner, No-Dues clearance, in-app notifications.
   - `main`: Core ERP baseline.

3. **Running the App Locally**:
   ```bash
   npm install
   npx expo start -c
   ```
