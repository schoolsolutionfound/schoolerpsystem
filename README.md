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

## 📖 Architecture & Changelog

For a full breakdown of all added, modified, and consolidated/deleted legacy files compared to `main`, please refer to:
👉 **[`CHANGELOG.md`](file:///c:/Users/LENOVO/Desktop/schoolerpsystem/CHANGELOG.md)**
