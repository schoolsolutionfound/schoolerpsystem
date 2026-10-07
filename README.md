# KIVQUO - School ERP System

Full-stack school management system with React Native (Expo) frontend and Fastify + PostgreSQL backend. Supports 10 user roles: Developer, Admin, Teacher, Student, Parent, Principal, HOD, Accountant, Driver, Librarian.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native 0.81.5, Expo SDK 54, Expo Router v6, TypeScript 5.9 |
| State | Zustand 5.x, TanStack React Query 5.x |
| Backend | Fastify 5.x, PostgreSQL, Drizzle ORM |
| Auth | Firebase Authentication (email/password) |
| Design | Poppins font, custom color system (#F4C430 gold, #171717 dark) |

## Quick Start

### Frontend (Mobile App)

```bash
cd schoolerpsystem
npm install
npx expo start
```

Scan QR code with Expo Go, or press `a` (Android), `i` (iOS), `w` (web).

### Backend (API Server)

```bash
cd schoolerpsystem/server
npm install
npm run dev          # Development with hot reload (tsx watch)
npm run build        # Compile TypeScript
npm start            # Production (node dist/index.js)
```

Server runs on `http://localhost:5000/api/v1`.

### Environment Variables

Copy `.env.example` to `.env` in both root and `server/` directories:

```bash
# Root (.env) - Expo
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1

# Server (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/school_erp
FIREBASE_PROJECT_ID=your-project-id
```

## Test Credentials

| Role | Email | Password | Institution |
|------|-------|----------|-------------|
| Developer | dev@schoolerp.dev | Dev@1234 | — |
| Admin | safwancoding1919@gmail.com | Safwan@123 | TST001 |
| Teacher (Kadar) | kadar@gmail.com | Kadar@123 | TST001 |
| Student (Safwan) | safwanhaneef786@gmail.com | (ask Safwan) | TST001 |
| Test Students | `<name>.student@schoolerp.test` | (fake Firebase — cannot login) | TST001 |

> Test students (`*.student@schoolerp.test`) have synthetic Firebase UIDs and **cannot authenticate**. Use real accounts only.

## Folder Structure

```
schoolerpsystem/
│
├── app/                              # Expo Router (file-based routing)
│   ├── _layout.tsx                   #   Root layout (fonts, providers)
│   ├── auth.tsx                      #   Login screen
│   ├── welcome.tsx                   #   Welcome/onboarding
│   ├── (admin)/                      #   Admin route group
│   │   ├── _layout.tsx              #     Tab layout (sidebar tabs)
│   │   ├── home.tsx                 #     Dashboard with drawer navigation
│   │   └── profile.tsx             #     Profile settings
│   ├── (teacher)/                    #   Teacher route group
│   ├── (student)/                    #   Student route group
│   ├── (parent)/                     #   Parent route group
│   ├── (developer)/                  #   Developer route group (most complex)
│   ├── (driver)/                     #   Driver route group
│   ├── (accountant)/                 #   Accountant route group
│   ├── (principal)/                  #   Principal route group
│   ├── (hod)/                        #   Head of Department route group
│   └── (librarian)/                  #   Librarian route group
│
├── features/                         # Role-based feature modules
│   ├── admin/                        #   Admin components (19 files)
│   │   └── components/
│   │       ├── AdminDashboardView.tsx
│   │       ├── AdminStudentsView.tsx
│   │       ├── AdminTeachersView.tsx    # Edit/delete teacher UI
│   │       ├── AdminAttendanceView.tsx
│   │       ├── AdminTimetableView.tsx
│   │       ├── AdminDrawer.tsx
│   │       └── ...
│   ├── teacher/                      #   Teacher components (15 files)
│   │   └── components/
│   │       ├── AttendanceMarkingView.tsx
│   │       ├── TeacherMarksView.tsx
│   │       ├── TeacherHomeworkView.tsx
│   │       ├── TeacherChatView.tsx
│   │       ├── TeacherLocateStudentsView.tsx
│   │       ├── TeacherDrawer.tsx
│   │       └── ...
│   ├── student/                      #   Student components (21 files)
│   │   └── components/
│   │       ├── StudentMarksView.tsx
│   │       ├── StudentAttendanceView.tsx
│   │       ├── StudentHomeworkView.tsx
│   │       ├── StudentBusTrackingView.tsx
│   │       ├── StudentDrawer.tsx
│   │       └── skeletons/            #     Loading skeleton UIs
│   ├── parent/                       #   Parent components (9 files)
│   ├── accountant/                   #   Accountant/Finance (15 files)
│   │   ├── components/
│   │   ├── store/                    #     useFinanceStore (Zustand)
│   │   ├── types/                    #     finance.ts
│   │   └── utils/                    #     financeUtils.ts
│   ├── developer/                    #   Developer console (18 files)
│   │   ├── api/                      #     developer.api.ts
│   │   ├── components/
│   │   ├── hooks/                    #     useDeveloperQueries.ts
│   │   ├── screens/
│   │   ├── types/
│   │   └── validation/
│   ├── driver/                       #   Driver components (4 files)
│   ├── shared/                       #   Shared/reusable components (19 files)
│   │   └── components/
│   │       ├── AppButton.tsx
│   │       ├── AppCard.tsx
│   │       ├── AppInput.tsx
│   │       ├── AppModal.tsx
│   │       ├── EmptyState.tsx
│   │       ├── LoadingView.tsx
│   │       └── ...
│   ├── auth/                         #   Auth forms (2 files)
│   ├── hod/                          #   HOD (stub)
│   ├── librarian/                    #   Librarian (stub)
│   └── principal/                    #   Principal (stub)
│
├── api/                              # Client-side API layer
│   ├── client.ts                     #   Base apiClient (auth headers, error handling)
│   ├── auth.ts                       #   Login, register, sync
│   ├── academics.ts                  #   Marks, timetable, attendance, homework
│   ├── admin.ts                      #   Student/teacher/fee CRUD (30+ functions)
│   ├── users.ts                      #   User management
│   └── upload.ts                     #   File upload
│
├── store/                            # Global Zustand stores
│   ├── useUserStore.ts               #   Auth state, user info, role
│   ├── useConfigStore.ts             #   Institution config
│   └── secureStorage.ts              #   Secure token persistence
│
├── constants/                        # App constants
│   ├── theme.ts                      #   Colors, spacing, design tokens
│   └── fonts.ts                      #   FontFamily constants (Poppins)
│
├── utils/                            # Global utilities
│   └── errorHandler.ts               #   AppError class, error handling
│
├── schemas/                          # Zod validation schemas
│   ├── user.schema.ts
│   └── feed.schema.ts
│
├── assets/                           # Static assets (icons, logos, splash)
├── design/                           # UI mockups and screenshots
│
├── docs/                             # Documentation (gitignored — see note)
├── specs/                            # Feature specifications
├── .agents/rules/                    # AI agent coding guidelines (15 files)
│
├── server/                           # Fastify backend
│   ├── src/
│   │   ├── index.ts                  #   Server entry point (route registration)
│   │   └── modules/                  #   Backend modules
│   │       ├── academics/            #     Marks, exams, timetable, attendance, homework
│   │       │   ├── academics.routes.ts
│   │       │   ├── academics.controller.ts
│   │       │   ├── academics.service.ts
│   │       │   ├── academics.repository.ts
│   │       │   └── academics.schema.ts
│   │       ├── admin/                #     Student/teacher/fee management
│   │       ├── auth/                 #     Firebase auth, login-sync
│   │       ├── developer/            #     Institution/admin CRUD
│   │       ├── institutions/         #     Institution config
│   │       ├── users/                #     User management
│   │       └── shared/               #     Shared infra
│   │           ├── config/firebase.ts
│   │           ├── db/index.ts       #       DB connection + helpers
│   │           ├── db/schema.ts      #       Drizzle schema (18 tables)
│   │           └── middleware/auth.ts #       Auth + role-based access control
│   ├── scripts/                      #   Migration/seed scripts (36 files)
│   └── drizzle/                      #   SQL migrations
│
├── developer-console/                # Separate Vite+React developer console
│   └── src/                          #   Standalone web app for super-admin
│
├── ARCHITECTURE.md                   # System architecture (routes, tables, components)
├── ARCHITECTURE.html                 # Visual architecture (interactive HTML)
└── PHASE1.md                         # Phase 1 roadmap
```

## Backend Architecture

Each backend module follows a consistent 4-layer pattern:

```
routes.ts  →  controller.ts  →  service.ts  →  repository.ts  →  DB (Drizzle ORM)
```

- **routes.ts** — Fastify route definitions with auth middleware
- **controller.ts** — Request/response handling
- **service.ts** — Business logic
- **repository.ts** — Database queries (PostgreSQL + in-memory fallback)
- **schema.ts** — Zod validation schemas (where applicable)

## API Endpoints

93 total endpoints across 7 modules:

| Module | Prefix | Endpoints | Description |
|--------|--------|-----------|-------------|
| auth | `/api/v1/auth` | 5 | Login, register, sync, password reset |
| admin | `/api/v1/admin` | 26 | Student/teacher/fee/user CRUD, multi-role editing, dashboard |
| admissions | `/api/v1/admissions` | 4 | Application submission, multi-tenant list, status updates, entrance test scheduling |
| academics | `/api/v1/admin` | 47 | Marks, exams, timetable, attendance, homework |
| developer | `/api/v1/developer` | 8 | Institution/admin management |
| institutions | `/api/v1/institutions` | 4 | Institution config |
| users | `/api/v1/users` | 4 | User queries |

## Database

19 tables managed by Drizzle ORM:

`users`, `admissions`, `class_sections`, `subjects`, `subject_teachers`, `timetable_slots`, `attendance_sessions`, `attendance_records`, `exams`, `exam_subjects`, `marks`, `homework`, `student_classes`, `fee_structures`, `fee_payments`, `student_documents`, `notifications`, `institution_config`, `institutions`

## Admissions & Multi-Tenant Enrollment (`feature/admission`)

- **Two-Phase Admission Approval & Parent Decision**:
  - **School Review**: School admins evaluate applications, schedule entrance tests, and extend admission offers (`status: 'approved'`).
  - **Parent Decision**: Parents receive interactive offer cards with **"Accept Offer & Enroll"** and **"Decline Offer"**.
  - **Multi-School Competing Offers**: When a parent accepts an offer from one campus, competing offers from other institutions for that student automatically transition to `'offer_declined'`.
  - **Automated Student & Parent Linking**: Acceptance creates the official student record with USN and links the student to the parent's profile in PostgreSQL and Firestore.
- **Entrance Test Scheduling**:
  - Full interactive custom calendar grid, month navigator, preset date chips, visual time slot selector, and native DateTimePicker integration.
- **Strict Multi-Tenant Isolation**:
  - School admins are locked exclusively to their assigned institution campus. The cross-campus switcher is reserved for platform developers (`dev`).
- **Parent School Discovery Filtering**:
  - Once a student is accepted/enrolled, the Discover feed displays only that affiliated institution campus with an "Enrolled" badge.
- **Multi-Role Staff & Workspace Switcher**:
  - Staff accounts support multiple simultaneous roles (e.g. `['accountant', 'admission_officer']`) with on-the-fly workspace switching and admin role promotion.

> [!NOTE]
> **File Audit for `feature/admission`**:
> **Zero (0) files were deleted** for this feature. All changes are strictly additive and non-breaking across existing modules.

## Key Features

- **Role-based dashboards** — Each role (admin, teacher, student, parent, accountant, admission officer, etc.) has a tailored home screen with relevant widgets
- **Drawer navigation** — Sidebar drawers for in-page tab switching (no page reload)
- **Attendance** — Teacher marks attendance per timetable slot; students/parents view history
- **Marks & Exams** — Create exams, enter marks, students view per-subject scores with grades
- **Timetable** — Class/teacher/student timetable views with weekly schedule
- **Homework** — Teachers create, students/parents view with subject/class assignment
- **Bus Tracking** — Real-time driver location sharing with parents/students
- **Fee Management** — Fee structures, payment tracking, student fee summaries
- **Chat** — Teacher-to-student messaging (prototype)
- **Skeleton loading** — Shimmer loading states for all major views

## Contributing

1. Read `ARCHITECTURE.md` for system overview
2. Check `.agents/rules/` for AI coding guidelines
3. Each role's code lives in `features/<role>/` and `app/(<role>)/`
4. Backend changes go in `server/src/modules/`
5. After backend changes, rebuild with `npm run build` in `server/`
6. Run `npx tsc --noEmit` in root to verify frontend types

## License

Private — School internal use only.
