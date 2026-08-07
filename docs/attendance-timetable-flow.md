# Attendance & Timetable — Overall Flow

## Purpose

This document describes the complete end-to-end flow for timetable creation and attendance marking.

It covers how the Institution Administrator assigns class teachers and subject teachers, how the class teacher builds the timetable, how subject teachers mark attendance per period, and how students, parents, HODs, and Principals consume the data.

This document represents the business workflow and serves as the foundation for application design of the Timetable and Attendance modules.

---

# Role Overview

| Role | Responsibility |
| --- | --- |
| Developer | Platform-level management |
| Institution Administrator / Maintainer | Institution setup, assign class & subject teachers, define periods |
| Class Teacher | Owns and builds the timetable for their assigned class/section |
| Subject Teacher | Marks attendance for their scheduled periods |
| Student | Views own timetable and attendance history |
| Parent | Views linked student's attendance (read-only) |
| HOD | Department-wide attendance overview (college) |
| Principal | Institution-wide attendance overview (school) |
| Accountant / Librarian | No attendance access |

---

# School vs College Differences

| | School | College |
| --- | --- | --- |
| Class unit | Class 1–12 + Section | Department + Academic Year + Section |
| Class teacher | 1 per class | 1 per section |
| Subject teachers | 1 per subject | 1+ per subject (professor can teach multiple sections) |
| Periods | Fixed (6–8 per day) | Flexible (lectures, labs, tutorials) |
| Attendance view | Student sees class attendance | Student sees subject-wise attendance |
| Oversight | Principal | HOD |

---

# Phase 1 — Institution Setup (Admin / Maintainer)

The Institution Administrator prepares the academic structure for daily operations.

## 1. Create Institution (already built)

- Institution type: `school` or `college`
- Departments (college) or Classes (school)
- Academic Years (college) or Sections (school)
- Courses (if applicable)

## 2. Create Users (already built)

- Students, Teachers, HOD, Principal, Parent, etc.

## 3. Assign Class Teacher (new)

Each class/section gets one class teacher who owns the timetable.

School:
```
Class 1 Section A → Teacher X
Class 2 Section A → Teacher Y
Class 3 Section A → Teacher Z
```

College:
```
CSE 1st Year Section A → Teacher X
CSE 1st Year Section B → Teacher Y
CSE 2nd Year Section A → Teacher Z
```

## 4. Assign Subject Teachers (new)

Each subject for a class/section is assigned to a teacher.

School:
```
Class 1 Section A
  → Mathematics  → Prof A
  → Science      → Prof B
  → English      → Prof C
```

College:
```
CSE 1st Year Section A
  → Data Structures → Prof P
  → Digital Logic   → Prof Q
  → DBMS            → Prof R
```

## 5. Define Periods (new)

Period timing slots used by the timetable.

School:
```
Period 1: 09:00 – 09:50
Period 2: 09:50 – 10:40
Period 3: 10:40 – 11:30
Period 4: 11:30 – 12:20
Period 5: 12:20 – 13:10
... (6–8 periods per day)
```

College: same structure but flexible (lectures, labs, tutorials).

## 6. Configure Academic Terms (new)

Attendance resets every term/semester.

```
Academic Year: 2026-27
  ├── Semester 1
  ├── Semester 2
  └── (optional Term 1 / Term 2 for schools)
```

- `academic_year` — e.g. `2026-27`
- `term` — e.g. `Semester 1`, `Semester 2`, `Term 1`, `Term 2`
- All attendance records and reports are scoped to `(academic_year, term)`
- Attendance statistics reset at the start of each term

## 7. Configure Holiday Calendar (new)

A dates list stored on the institution config — no class takes place on these dates and no attendance is generated.

```
blockedDates: [
  { date: '2026-08-15', reason: 'Independence Day' },
  { date: '2026-09-07', reason: 'Ganesh Chaturthi' },
  { date: '2026-11-03', reason: 'Mid-term Exam (Week 1)' },
  { date: '2026-11-04', reason: 'Mid-term Exam (Week 2)' },
  ...
]
```

Holidays include: Sunday, festivals, exams, vacations.

Rules:
- Attendance UI hides periods falling on a blocked date
- Reports exclude blocked dates from totals
- Teachers cannot mark attendance for a blocked date
- `reason` provides context (festival / exam / vacation)

---

# Phase 2 — Class Teacher Builds Timetable

The class teacher owns the timetable for their class/section.

```
Class Teacher
    ↓
Opens "My Timetable" → sees their assigned class/section
    ↓
Builds weekly schedule (subject + assigned teacher + room per slot)
    ↓
Saves / edits / rearranges anytime
```

Weekly schedule example:

| | Mon | Tue | Wed | Thu | Fri |
| --- | --- | --- | --- | --- | --- |
| 09:00 | Math (Prof A) | Math (Prof A) | Math (Prof A) | Math (Prof A) | Math (Prof A) |
| 09:50 | Science (Prof B) | Science (Prof B) | Science (Prof B) | Science (Prof B) | Science (Prof B) |
| 10:40 | English (Prof C) | English (Prof C) | English (Prof C) | English (Prof C) | English (Prof C) |
| 11:30 | DS (Prof P) | DL (Prof Q) | DBMS (Prof R) | DS (Prof P) | DL (Prof Q) |
| 12:20 | Lab (Prof P) | Lab (Prof P) | — | Lab (Prof P) | — |

Each timetable cell = `{ subject, assigned teacher, room, day, period }`.

The class teacher arranges the assigned subject teachers into the slots. Only the class teacher (or institution administrator) can modify the timetable.

## Timetable Versioning

The timetable can change mid-term (e.g., Math moves from Monday 9AM to Monday 11AM). Old attendance must remain linked to the old schedule.

Instead of updating rows in place, the timetable is versioned:

```
Timetable (header)                    TimetableSlots
  Version 1  effective 1 Jun   ──→     Mon 09:00 Math (Prof A)
                                       Mon 09:50 Science (Prof B)
                                       ...
  Version 2  effective 15 Jul  ──→     Mon 09:00 Physics (Prof C)
                                       Mon 09:50 Math (Prof A)
                                       ...
```

- Each version carries `effective_from` (date)
- A new version supersedes the old one — old rows are never mutated
- Attendance always references the **timetable slot used on that date**, so historical records stay accurate
- Student/teacher views resolve the version that is effective on the queried date

---

# Phase 3 — Student Views Timetable

The student profile carries a `classSectionId`. The student app fetches the timetable for that section.

```
Student
    ↓
Opens "Today's Schedule" tab
    ↓
Sees their class timetable for the day
```

```
┌─────────────────────────────────────┐
│  09:00  Mathematics   Prof A  Rm 101 │
│  09:50  Science       Prof B  Rm 202 │
│  10:40  English       Prof C  Rm 103 │
│  11:30  Data Str.     Prof P  Rm 301 │
│  12:20  Lab           Prof P  Lab 1  │
└─────────────────────────────────────┘
```

---

# Phase 4 — Subject Teacher Marks Attendance

The subject teacher opens "My Periods" for today and sees all their scheduled periods across sections.

```
Subject Teacher
    ↓
Opens "My Periods" → sees today's schedule
    ↓
Taps a period → student roster for that class/subject/date
    ↓
Marks each student (default: Present) / marks absentees
    ↓
Saves → attendance record created
```

Today's schedule for Prof A:

```
┌─────────────────────────────────────┐
│ 09:00  CSE 1A  Math  → [Mark]  ✓   │
│ 11:30  CSE 2B  DS    → [Mark]  ✓   │
│ 14:00  CSE 1B  Math  → [Mark]       │
└─────────────────────────────────────┘
```

Tapping "Mark" for 09:00 CSE 1A Math:

```
┌─────────────────────────────────────┐
│  Date:    2026-08-04                │
│  Subject: Mathematics               │
│  Class:   CSE 1st Year Section A    │
│                                     │
│  [✓ Mark All Present]               │
│                                     │
│  1MS21CS001  Aarav Sharma    [✓]    │
│  1MS21CS002  Priya Verma     [✓]    │
│  1MS21CS003  Arjun Reddy     [✓]    │
│  1MS21CS004  Sneha Patil     [✓]    │
│                                     │
│  [Save Attendance]                  │
└─────────────────────────────────────┘
```

## Bulk Mark (labs & large classes)

- **"Mark All Present"** button sets the whole roster to Present in one tap
- Teacher then unchecks the absentees only
- Drastically faster for labs (60+ students) than tapping every row

## Attendance References the Timetable Slot

Attendance does **not** duplicate class/subject/teacher/period columns. It references the timetable slot used on that date — everything else derives from the slot.

```
attendance_records: { id, timetable_slot_id, date, taken_by_teacher_id, status, submitted_at, locked_at }
attendance_entries: { id, attendance_record_id, student_id, attendance_status, remarks }
```

Benefits:
- No duplicated columns
- Historical consistency when the timetable is re-versioned
- Simpler reporting (join through the slot)

## Attendance Status (enum)

Per-student status:

```
present
absent
late
excused
```

- `late` / `excused` are supported from the start (no migration needed later)
- `holiday` / `cancelled` are NOT student statuses — a holiday/cancelled class simply means no attendance record exists (it is a property of the schedule, not the student)

## Duplicate Prevention

A **unique constraint** on `(timetable_slot_id, date)`:

- Only one attendance record can exist for a scheduled class on a given date
- A second attempt to mark updates the existing record instead of creating a duplicate

## Attendance Lock

Teachers cannot edit attendance indefinitely.

Policy:
- Attendance is editable until **end of the same day**
- After the window closes, the record is `locked`
- Institution Administrators may unlock/override if policy allows
- `submitted_at` and `locked_at` timestamps are stored on the record

Attendance is tied to the timetable slot: `{ timetable_slot_id, date, entries[] }`.

Teachers can only mark attendance for classes/subjects assigned to them.

---

# Phase 5 — Student / Parent View Attendance

## Student

```
Student
    ↓
Opens "Attendance" tab
    ↓
Sees overall attendance % + per-subject breakdown + monthly calendar
```

```
Overall: 85% attendance
┌─────────────────────────────────────┐
│  Subject        Present  Total   %   │
│  Mathematics    42       48     87%  │
│  Science        45       48     93%  │
│  English        40       48     83%  │
│  Data Str.      38       48     79%  │
│  Lab            44       48     91%  │
└─────────────────────────────────────┘

Monthly calendar view:
(green = present, red = absent)
```

## Parent

The parent is linked to a student via `linkedStudentUSN` (captured in their complete-profile form).

```
Parent
    ↓
Opens "Attendance" tab
    ↓
Sees linked student's attendance (read-only)
    ↓
Same breakdown as the student view
```

Parents cannot modify attendance — view only.

---

# Phase 6 — Reports (HOD / Principal / Admin)

## HOD (college only)

```
HOD
    ↓
Selects department (e.g., CSE)
    ↓
Sees per-section attendance overview
```

```
┌─────────────────────────────────────┐
│  Section    Avg Attendance   Alerts  │
│  CSE 1A     87%              2       │
│  CSE 1B     92%              0       │
│  CSE 2A     78%              5  ⚠️   │
│  CSE 2B     95%              0       │
└─────────────────────────────────────┘

Can drill down per section / per subject.
```

## Principal (school)

```
Principal
    ↓
Sees institution-wide overview
```

```
┌─────────────────────────────────────┐
│  Class    Avg Attendance   Alerts   │
│  Class 1  91%              1        │
│  Class 2  85%              3  ⚠️    │
│  Class 3  88%              2        │
└─────────────────────────────────────┘
```

## Admin

```
Admin
    ↓
Institution config + overall stats
    ↓
Sees all classes, all teachers, all subjects
```

---

# Data Flow Summary

```
Admin ──creates──→ Class/Section + Subject Teachers + Periods + Terms + Holidays
  │
  ▼
Class Teacher ──builds──→ Timetable Version (timetable_slots)
  │                        │
  │                        ▼
  │                   Students see schedule
  │
  ▼
Each Day:
  Subject Teacher ──opens──→ Today's Periods (effective timetable slots)
    │
    ▼
  Taps slot ──marks──→ Student Roster (✓/✗, Mark All Present)
    │
    ▼
  Saves ──→ attendance_record (timetable_slot_id + date) + attendance_entries
    │
    ▼
  Locked at end of day (unique per slot+date, no duplicates)
    │
    ▼
  Student/Parent/HOD/Principal ──view──→ Reports + Stats
```

---

# Data Model (New Tables)

| Table | Purpose |
| --- | --- |
| `class_sections` | Class/section with assigned class teacher |
| `subjects` | Subjects per class/section |
| `subject_teachers` | Teacher ↔ subject ↔ class mapping |
| `periods` | Period timing slots (label + start/end time) |
| `timetables` | Timetable header — version + effective_from + class_section |
| `timetable_slots` | One slot per day × period × subject × teacher × room, belongs to a timetable version |
| `attendance_records` | One per timetable_slot × date (references the slot, no duplicated class/subject/teacher) |
| `attendance_entries` | One per student per record |

Plus fields on existing data:
- Institution config: `academicYears` + `terms`, `blockedDates` (holiday calendar)

## Proposed Endpoints

| Method | Endpoint | Role | Purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/admin/class-sections` | Admin | Create class/section + assign class teacher |
| GET | `/api/v1/admin/class-sections` | Admin | List class/sections |
| POST | `/api/v1/admin/subject-teachers` | Admin | Assign subject teacher to a class/section |
| GET | `/api/v1/admin/subject-teachers` | Admin | List subject-teacher mappings |
| POST | `/api/v1/admin/periods` | Admin | Define period slots |
| GET | `/api/v1/admin/periods` | Admin | List period slots |
| PUT | `/api/v1/admin/config/terms` | Admin | Configure academic year + terms |
| PUT | `/api/v1/admin/config/holidays` | Admin | Configure holiday calendar (blocked dates) |
| POST | `/api/v1/timetable` | Class Teacher / Admin | Create a new timetable version |
| GET | `/api/v1/timetable/class?classSectionId&date` | Student / Class Teacher | Get effective timetable for a class |
| GET | `/api/v1/timetable/teacher?date` | Subject Teacher | Get today's / weekly periods for a teacher |
| POST | `/api/v1/attendance/mark` | Subject Teacher | Mark attendance for a timetable slot / date |
| GET | `/api/v1/attendance/roster?timetableSlotId&date` | Subject Teacher | Student roster for marking |
| GET | `/api/v1/attendance/history/student` | Student | Own attendance summary |
| GET | `/api/v1/attendance/history/parent` | Parent | Linked student's attendance |
| GET | `/api/v1/attendance/stats/department` | HOD | Department overview |
| GET | `/api/v1/attendance/stats/institution` | Principal / Admin | Institution overview |

---

# Deferred (v2 — not in the first build)

The following are explicitly out of scope for the initial implementation and deferred to a later version:

- **Substitute teachers** — scheduled teacher vs actual (`taken_by_teacher_id`) is already in the model, but substitution workflows come later
- **Teacher leave** — showing periods as "Pending / Need Substitute" when a teacher is on leave
- **Exam timetable** — an alternate timetable during exams, or disabling attendance for exam periods
- **Offline support** — loading a roster, marking offline, syncing later
- **Attendance audit log** — tracking every edit (original → edited → by whom → reason)
- **Automatic notifications** — low-attendance alerts to parents, "not submitted" reminders to teachers, section-average alerts to HODs
- **Detailed holiday management** — a full calendar module; v1 only stores a blocked-dates list

These were evaluated and intentionally deferred so the core timetable + attendance loop ships first.

---

# Build Order

1. Server schema + admin APIs (class sections, subject teachers, periods, terms, holiday calendar)
2. Timetable module: class teacher builds versioned timetable + student views
3. Attendance module: teacher marks (slot + date, mark-all, lock) + student/parent views
4. Reports: HOD / Principal / Admin dashboards
5. Deferred to v2: substitutions, teacher leave, exam timetable, offline, audit log, notifications

---

# Guiding Principles

The Institution Administrator sets up the academic structure; teachers perform academic operations.

Every class/section has exactly one class teacher who owns the timetable.

Attendance is tied to timetable periods and is marked by the assigned subject teacher.

Students and parents consume academic information but never modify it.

Only the assigned teacher may create or modify attendance records for their periods.

The workflow follows the platform responsibility hierarchy: Developer → Institution Administrator → Teacher → Student.
