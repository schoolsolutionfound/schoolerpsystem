# Feature Roadmap

## Purpose

This document defines every feature each role should have, what is already built,
and what must still be implemented — ordered by priority.

---

# Role Hierarchy

```
Developer
    ↓
Institution Admin (School / College)
    ↓
Teacher
    ↓
Student
```

---

# Current State Overview

| Role | Home Route | Tabs / Pages | Backend Endpoints | Status |
|---|---|---|---|---|
| Developer | Web console (:5173) | Dashboard, Institutions, Admins, Plans, Settings | 10 ✓ | Complete |
| Institution Admin | `/admin-home` | Dashboard, Institution, Students, Teachers, Profile | 6 ✓ | Functional, missing edit/delete |
| Teacher | `/teacher-home` | 6 cards (attendance, grades, classes, timetable, announcements, notifications) | 0 | Placeholder UI only |
| Student | `/home` | Home, Attendance, Schedule, Reports, Profile | 2 | Partially built |

## Note: Maintainer Role

Defined in `Role` enum but not used. Intended as a super-admin between Developer
and Institution Admin. Should get a read-only web portal similar to Developer
Console. Hold off until Admin and Teacher are complete.

---

# Phase 1: Developer Console (Complete)

Already built. See `developer-console/` and `docs/01-developer-console.md`.

---

# Phase 2: Institution Admin Portal

## 2.1 School vs College

Both use the **same `admin` role** and **same code**. The only difference is
what data they configure:

| Feature | School | College |
|---|---|---|
| Academic units | Classes (Grade 1-12), Sections (A/B/C) | Departments + Academic Years + Courses |
| Student grouping | By Class + Section | By Department + Year + Course |
| Teacher assignment | By Class + Subject | By Department |
| Timetable | Period-based by class | Lecture/semester-based |
| Reports | Grade-wise, subject-wise | Semester-wise, CGPA |

## 2.2 Already Built (skip)

- [x] Dashboard with student/teacher counts
- [x] Institution config (departments, years, courses, sections)
- [x] Create student (with Firebase Auth account)
- [x] List students
- [x] Create teacher (with Firebase Auth account)
- [x] List teachers
- [x] Admin profile + logout

## 2.3 Build Order (by priority)

### Step 1 — Edit & Delete Students (High)

**Backend:**
- `PUT /api/v1/admin/students/:id` — Update student fields
- `DELETE /api/v1/admin/students/:id` — Remove student

**Frontend:**
- Edit button → modal prefilled with student data
- Delete button → confirmation dialog
- Wire into `AdminStudentsView.tsx`

**Files:**
- `server/src/modules/admin/admin.controller.ts`
- `server/src/modules/admin/admin.service.ts`
- `features/admin/components/AdminStudentsView.tsx`
- `api/admin.ts`

---

### Step 2 — Edit & Delete Teachers (High)

**Backend:**
- `PUT /api/v1/admin/teachers/:id`
- `DELETE /api/v1/admin/teachers/:id`

**Frontend:**
- Edit button → modal with teacher data
- Delete button → confirmation

**Files:**
- `server/src/modules/admin/admin.controller.ts`
- `server/src/modules/admin/admin.service.ts`
- `features/admin/components/AdminTeachersView.tsx`

---

### Step 3 — Student & Teacher Detail View (Medium)

**Backend:**
- `GET /api/v1/admin/students/:id` — Full profile, attendance %, grades
- `GET /api/v1/admin/teachers/:id` — Full profile, assigned classes/subjects

**Frontend:**
- Tap student row → detail screen
- Tap teacher row → detail screen

---

### Step 4 — Student Filters & Search (Medium)

- Filter students by department, academic year, section, course
- Search by name, roll number, email

---

### Step 5 — Bulk CSV Import (High)

UI components already exist at:
- `features/admin/components/BulkFeedStep1.tsx`
- `features/admin/components/BulkFeedStep2.tsx`
- `features/admin/components/BulkFeedStep3.tsx`

Backend endpoints already exist:
- `POST /api/v1/admin/single-feed`
- `POST /api/v1/admin/bulk-feed`

**What's needed:**
- Wire the UI into `admin-home.tsx` navigation
- Add a "Bulk Import" button on the Students or Teachers tab

---

### Step 6 — Attendance Dashboard (Medium)

- View today's attendance summary by class/department
- View absent/tardy trends
- Backend: `GET /api/v1/admin/attendance/summary`

---

### Step 7 — Notifications / Announcements (Medium)

- Send announcements to teachers and students
- Backend: `POST /api/v1/admin/announcements`
- Frontend: Compose screen in admin portal

---

### Step 8 — Timetable Overview (Low)

- View master timetable
- Backend: `GET /api/v1/admin/timetable`

---

### Step 9 — Exam & Grade Reports (Low)

- View submitted grades per class/subject
- Generate report cards
- Backend: `GET /api/v1/admin/grades/report`

---

### Step 10 — Fee Management (Low)

- View fee status per student
- Future role: Accountant will own this

---

# Phase 3: Teacher Portal

## 3.1 Already Built

- [x] Home screen with 6 feature cards (navigation only)

## 3.2 Build Order

### Step 1 — Mark Attendance (Critical)

**Backend:**
- `POST /api/v1/teacher/attendance/mark` — Mark present/absent/late/excused for a class/period
- `GET /api/v1/teacher/attendance/today` — Get today's attendance for my classes

**Frontend:**
- Select class → select period → student roster → mark each student → submit

**Files:**
- `server/src/modules/teacher/` (new module)
- `app/teacher-attendance.tsx` (new)
- `features/teacher/` (new feature folder)

**Data model (attendance table):**
```
attendance:
  id            text PK
  institution_code  varchar(100)
  student_id    text (references users.id)
  teacher_id    text (references users.id)
  date          date
  period        varchar(50)
  status        varchar(20)  -- present, absent, late, excused
  marked_at     timestamp
  updated_at    timestamp
```

---

### Step 2 — Enter Grades (Critical)

**Backend:**
- `POST /api/v1/teacher/grades/upload` — Upload marks for a class/subject
- `GET /api/v1/teacher/grades/my-classes` — Get assigned classes with submission status

**Frontend:**
- Select class → select subject → enter marks per student → submit

**Data model (grades table):**
```
grades:
  id            text PK
  institution_code  varchar(100)
  student_id    text
  teacher_id    text
  class         varchar(100)
  subject       varchar(100)
  exam_type     varchar(50)  -- midterm, final, quiz, assignment
  marks_obtained  numeric
  total_marks   numeric
  grade         varchar(5)   -- A, B+, B, etc.
  submitted_at  timestamp
```

---

### Step 3 — My Classes (High)

- View assigned classes and student rosters
- Backend: `GET /api/v1/teacher/classes`

---

### Step 4 — Timetable (Medium)

- View personal teaching schedule
- Backend: `GET /api/v1/teacher/timetable`

---

### Step 5 — Announcements (Medium)

- View announcements from admin
- Backend: `GET /api/v1/teacher/announcements`

---

### Step 6 — Notifications (Medium)

- View push notifications
- Backend: `GET /api/v1/notifications`

---

# Phase 4: Student Portal

## 4.1 Already Built

- [x] Home tab (header, attendance card, announcements, periods list)
- [x] First-login flow: change password → complete profile → home
- [x] API: `POST /auth/change-password`
- [x] API: `POST /users/complete-profile`

## 4.2 Build Order

### Step 1 — Attendance Screen (High)

Tab exists but is placeholder. Show:
- Monthly attendance calendar
- Attendance percentage per subject
- Detailed daily logs

**Backend:**
- `GET /api/v1/student/attendance` — My attendance records

---

### Step 2 — Schedule / Timetable (High)

- View daily/weekly class schedule
- Backend: `GET /api/v1/student/timetable`

---

### Step 3 — Grades / Reports (High)

- View marks per subject/exam
- Download report card
- Backend: `GET /api/v1/student/grades`

---

### Step 4 — Profile (Medium)

- Edit personal info
- Upload profile picture
- Backend: `PUT /api/v1/users/me`

---

### Step 5 — Notifications (Medium)

- View push notifications
- Backend: `GET /api/v1/notifications`

---

### Step 6 — Assignments (Low)

- View/download assignments from teachers
- Backend: `GET /api/v1/student/assignments`

---

# Backend API Summary

## Missing Endpoints (all roles)

### Admin Endpoints
| Method | Route | Priority |
|---|---|---|
| PUT | `/api/v1/admin/students/:id` | High |
| DELETE | `/api/v1/admin/students/:id` | High |
| PUT | `/api/v1/admin/teachers/:id` | High |
| DELETE | `/api/v1/admin/teachers/:id` | High |
| GET | `/api/v1/admin/students/:id` | Medium |
| GET | `/api/v1/admin/teachers/:id` | Medium |
| GET | `/api/v1/admin/attendance/summary` | Medium |
| POST | `/api/v1/admin/announcements` | Medium |
| GET | `/api/v1/admin/timetable` | Low |
| GET | `/api/v1/admin/grades/report` | Low |

### Teacher Endpoints
| Method | Route | Priority |
|---|---|---|
| POST | `/api/v1/teacher/attendance/mark` | Critical |
| GET | `/api/v1/teacher/attendance/today` | Critical |
| POST | `/api/v1/teacher/grades/upload` | Critical |
| GET | `/api/v1/teacher/classes` | High |
| GET | `/api/v1/teacher/timetable` | Medium |
| GET | `/api/v1/teacher/announcements` | Medium |

### Student Endpoints
| Method | Route | Priority |
|---|---|---|
| GET | `/api/v1/student/attendance` | High |
| GET | `/api/v1/student/timetable` | High |
| GET | `/api/v1/student/grades` | High |
| PUT | `/api/v1/users/me` | Medium |
| GET | `/api/v1/notifications` | Medium |
| GET | `/api/v1/student/assignments` | Low |

---

# Database Tables Needed

## attendance
```sql
CREATE TABLE attendance (
  id text PRIMARY KEY,
  institution_code varchar(100) NOT NULL,
  student_id text NOT NULL REFERENCES users(id),
  teacher_id text NOT NULL REFERENCES users(id),
  date date NOT NULL,
  period varchar(50),
  status varchar(20) NOT NULL CHECK (status IN ('present','absent','late','excused')),
  marked_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
CREATE INDEX idx_attendance_inst ON attendance (institution_code);
CREATE INDEX idx_attendance_student ON attendance (student_id);
CREATE INDEX idx_attendance_date ON attendance (date);
```

## grades
```sql
CREATE TABLE grades (
  id text PRIMARY KEY,
  institution_code varchar(100) NOT NULL,
  student_id text NOT NULL REFERENCES users(id),
  teacher_id text NOT NULL REFERENCES users(id),
  class varchar(100) NOT NULL,
  subject varchar(100) NOT NULL,
  exam_type varchar(50) NOT NULL,
  marks_obtained numeric NOT NULL,
  total_marks numeric NOT NULL,
  grade varchar(5),
  submitted_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
CREATE INDEX idx_grades_inst ON grades (institution_code);
CREATE INDEX idx_grades_student ON grades (student_id);
```

## announcements
```sql
CREATE TABLE announcements (
  id text PRIMARY KEY,
  institution_code varchar(100) NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  target_role varchar(50) DEFAULT 'all',
  created_by text NOT NULL REFERENCES users(id),
  created_at timestamp DEFAULT now()
);
CREATE INDEX idx_announcements_inst ON announcements (institution_code);
```

## notifications
```sql
CREATE TABLE notifications (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id),
  title text NOT NULL,
  body text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications (user_id);
```

## teacher_class_assignments
```sql
CREATE TABLE teacher_class_assignments (
  id text PRIMARY KEY,
  institution_code varchar(100) NOT NULL,
  teacher_id text NOT NULL REFERENCES users(id),
  class varchar(100) NOT NULL,
  subject varchar(100) NOT NULL,
  department varchar(100),
  academic_year varchar(100),
  UNIQUE (teacher_id, class, subject)
);
CREATE INDEX idx_assignments_teacher ON teacher_class_assignments (teacher_id);
CREATE INDEX idx_assignments_inst ON teacher_class_assignments (institution_code);
```

## timetable
```sql
CREATE TABLE timetable (
  id text PRIMARY KEY,
  institution_code varchar(100) NOT NULL,
  class varchar(100) NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  period smallint NOT NULL,
  subject varchar(100) NOT NULL,
  teacher_id text NOT NULL REFERENCES users(id),
  room varchar(50)
);
CREATE INDEX idx_timetable_class ON timetable (institution_code, class, day_of_week);
```

---

# Implementation Order (Recommended)

| Order | Phase | Step | Effort |
|---|---|---|---|
| 1 | Admin | Edit/delete students | Small |
| 2 | Admin | Edit/delete teachers | Small |
| 3 | Teacher | Mark attendance | Large |
| 4 | Student | Attendance screen | Medium |
| 5 | Teacher | Enter grades | Large |
| 6 | Student | Grades/reports | Medium |
| 7 | Admin | Bulk CSV import | Small |
| 8 | Student | Schedule/timetable | Medium |
| 9 | Teacher | My classes | Medium |
| 10 | Admin | Student detail view | Small |
| 11 | All | Notifications | Medium |
| 12 | Admin | Attendance dashboard | Medium |
| 13 | Teacher | Timetable | Medium |
| 14 | Admin | Announcements | Medium |
| 15 | Student | Profile edit | Small |
| 16 | Admin | Timetable overview | Medium |
| 17 | Admin | Exam/grade reports | Large |
| 18 | Admin | Fee management | Large |
