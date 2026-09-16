# KIVQUO School ERP — Complete Architecture

> Auto-generated from the full codebase. Open in any Mermaid-compatible viewer (GitHub, VS Code, Notion, etc.)

---

## 1. System Architecture (High-Level)

```mermaid
graph TB
    subgraph Client["Mobile App (React Native / Expo)"]
        direction TB
        APP["Expo Router v6"]
        STATE["Zustand Stores<br/>(useUserStore, useConfigStore)"]
        API["API Client Layer<br/>(api/*.ts)"]
        FIREBASE_SDK["Firebase Auth SDK<br/>(Expo)"]
    end

    subgraph Roles["Role-Based Screens"]
        DEV["Developer Panel"]
        ADMIN["Admin Dashboard"]
        TEACHER["Teacher Home"]
        STUDENT["Student Home"]
        PARENT["Parent Dashboard"]
        PRINCIPAL["Principal Panel"]
        HOD["HOD Panel"]
        LIBRARIAN["Librarian Panel"]
        DRIVER["Driver Panel"]
        ACCOUNTANT["Accountant Panel"]
    end

    subgraph Server["Backend (Fastify + Node.js)"]
        direction TB
        ENTRY["index.ts<br/>Port 5000, CORS, Rate Limit"]
        AUTH_MW["Auth Middleware<br/>(Firebase Token Verify)"]
        ROUTES["Route Modules<br/>/api/v1/*"]
        CTRL["Controllers"]
        SVC["Services"]
        REPO["Repositories"]
    end

    subgraph DB["Database"]
        PG[("PostgreSQL<br/>schoolerp")]
        DRIZZLE["Drizzle ORM<br/>(schema.ts — 16 tables)"]
    end

    subgraph Firebase["Firebase Cloud"]
        FAUTH["Firebase Auth<br/>(User Management)"]
        FSTORE["Firebase Storage<br/>(Profile Pictures, Documents)"]
        FADMIN["Firebase Admin SDK<br/>(Server-Side)"]
    end

    APP --> API
    APP --> FIREBASE_SDK
    APP --> STATE
    Roles --> APP
    API -->|"HTTP/REST"| ENTRY
    FIREBASE_SDK -->|"ID Token"| FAUTH
    ENTRY --> AUTH_MW
    AUTH_MW -->|"verifyIdToken()"| FADMIN
    ENTRY --> ROUTES
    ROUTES --> CTRL
    CTRL --> SVC
    SVC --> REPO
    REPO --> DRIZZLE
    DRIZZLE --> PG
    FAUTH -.->|"Admin SDK"| FADMIN
```

---

## 2. Database Schema (Entity-Relationship Diagram)

```mermaid
erDiagram
    institutions ||--o{ users : "has"
    institutions ||--o{ class_sections : "has"
    institutions ||--o{ subjects : "has"
    institutions ||--o{ periods : "has"
    institutions ||--o{ exams : "has"
    institutions ||--o{ homework : "has"

    users ||--o{ student_classes : "enrolled in"
    users ||--o{ subject_teachers : "teaches"
    users ||--o{ timetables : "creates"
    users ||--o{ timetable_slots : "assigned to"
    users ||--o{ attendance_records : "takes"
    users ||--o{ attendance_entries : "marked as"
    users ||--o{ marks : "receives"
    users ||--o{ marks : "enters"
    users ||--o{ student_documents : "has"
    users ||--o{ exams : "creates"
    users ||--o{ homework : "creates"

    class_sections ||--o{ student_classes : "contains"
    class_sections ||--o{ subject_teachers : "has"
    class_sections ||--o{ timetables : "has"
    class_sections ||--o{ timetable_slots : "has"
    class_sections ||--o{ marks : "has"
    class_sections ||--o{ homework : "has"

    subjects ||--o{ subject_teachers : "taught by"
    subjects ||--o{ timetable_slots : "in slot"
    subjects ||--o{ exam_subjects : "examined in"
    subjects ||--o{ marks : "for subject"
    subjects ||--o{ homework : "assigned for"

    periods ||--o{ timetable_slots : "during"

    timetables ||--o{ timetable_slots : "contains"
    timetables ||--o{ attendance_records : "for slot"

    timetable_slots ||--o{ attendance_records : "has"
    timetable_slots ||--o{ attendance_entries : "for student"

    attendance_records ||--o{ attendance_entries : "contains"

    exams ||--o{ exam_subjects : "contains"
    exams ||--o{ marks : "has"
    exam_subjects ||--o{ marks : "for subject"

    institutions {
        text id PK
        varchar institution_code UK
        text institution_name
        varchar institution_type
        varchar subscription_status
        jsonb departments
        jsonb academic_years
        jsonb courses
        jsonb terms
        jsonb blocked_dates
        timestamp created_at
        timestamp updated_at
    }

    users {
        text id PK
        text firebase_uid UK
        varchar email UK
        text full_name
        varchar role
        varchar institution_code FK
        text institution_name
        varchar institution_type
        varchar roll_no_usn
        boolean must_change_password
        boolean profile_completed
        varchar parent_phone
        varchar student_phone
        text profile_pic_url
        varchar tenth_percentage
        varchar twelfth_percentage
        text title
        jsonb scope
        jsonb permissions
        timestamp graduated_at
        timestamp created_at
        timestamp updated_at
    }

    class_sections {
        text id PK
        varchar institution_code FK
        varchar name
        varchar department
        varchar academic_year
        varchar section
        text class_teacher_id
        timestamp created_at
        timestamp updated_at
    }

    subjects {
        text id PK
        varchar institution_code FK
        varchar name
        varchar code
        timestamp created_at
        timestamp updated_at
    }

    subject_teachers {
        text id PK
        varchar institution_code FK
        text class_section_id FK
        text subject_id FK
        text teacher_id FK
        timestamp created_at
        timestamp updated_at
    }

    periods {
        text id PK
        varchar institution_code FK
        varchar label
        varchar start_time
        varchar end_time
        integer sort_order
        timestamp created_at
        timestamp updated_at
    }

    timetables {
        text id PK
        varchar institution_code FK
        text class_section_id FK
        varchar academic_year
        varchar term
        integer version
        date effective_from
        text created_by
        timestamp created_at
        timestamp updated_at
    }

    timetable_slots {
        text id PK
        text timetable_id FK
        varchar institution_code FK
        text class_section_id FK
        text subject_id FK
        text teacher_id FK
        text period_id FK
        integer day_of_week
        varchar room
        timestamp created_at
        timestamp updated_at
    }

    attendance_records {
        text id PK
        varchar institution_code FK
        text timetable_slot_id FK
        date date
        text taken_by_teacher_id FK
        varchar status
        timestamp submitted_at
        timestamp locked_at
        timestamp created_at
        timestamp updated_at
    }

    attendance_entries {
        text id PK
        text attendance_record_id FK
        text student_id FK
        varchar attendance_status
        text remarks
        timestamp created_at
        timestamp updated_at
    }

    student_classes {
        text id PK
        varchar institution_code FK
        text student_id FK
        text class_section_id FK
        varchar roll_no
        varchar academic_year
        date effective_from
        date effective_to
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    exams {
        text id PK
        varchar institution_code FK
        varchar name
        varchar term
        varchar academic_year
        date start_date
        date end_date
        varchar status
        text created_by FK
        timestamp created_at
        timestamp updated_at
    }

    exam_subjects {
        text id PK
        text exam_id FK
        varchar institution_code FK
        text subject_id FK
        integer max_marks
        integer pass_marks
        timestamp created_at
    }

    marks {
        text id PK
        text exam_id FK
        text exam_subject_id FK
        varchar institution_code FK
        text student_id FK
        text class_section_id FK
        text subject_id FK
        numeric marks_obtained
        varchar grade
        text remarks
        text entered_by FK
        timestamp entered_at
        timestamp updated_at
    }

    student_documents {
        text id PK
        varchar institution_code FK
        text student_id FK
        varchar document_type
        text file_name
        text file_url
        timestamp created_at
    }

    homework {
        text id PK
        varchar institution_code FK
        text class_section_id FK
        text subject_id FK
        text teacher_id FK
        varchar title
        text description
        date due_date
        varchar priority
        varchar status
        varchar assigned_to
        timestamp created_at
        timestamp updated_at
    }
```

---

## 3. Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant U as User (Mobile)
    participant FA as Firebase Auth
    participant API as Fastify API
    participant MW as Auth Middleware
    participant Cache as Auth Cache (60s TTL)
    participant DB as PostgreSQL

    U->>FA: Login (email + password)
    FA-->>U: ID Token + Refresh Token

    U->>API: POST /auth/login-sync<br/>Authorization: Bearer <ID_TOKEN>
    API->>MW: authenticate()

    alt Cache Hit
        MW->>Cache: get(firebaseUid)
        Cache-->>MW: {role, institutionCode}
    else Cache Miss
        MW->>FA: admin.auth().verifyIdToken(token)
        FA-->>MW: {uid, email}
        MW->>DB: dbFindByUid(firebaseUid)
        DB-->>MW: {id, role, institutionCode, ...}
        MW->>Cache: set(firebaseUid, role, institutionCode)
    end

    MW-->>API: request.user = {uid, email, role, institutionCode}
    API->>DB: Enrich with institution data, parent-child links
    DB-->>API: Full user profile
    API-->>U: 200 OK + user profile + institution data

    Note over U,DB: Subsequent requests use same ID Token
    U->>API: GET /admin/students<br/>Authorization: Bearer <ID_TOKEN>
    API->>MW: authenticate() → cache hit → 60s
    MW-->>API: request.user
    API->>MW: requireAdmin()
    MW-->>API: role === 'admin' ✓
    API->>DB: Query students
    DB-->>API: Student list
    API-->>U: 200 OK + students
```

---

## 4. Role-Based Access Control (RBAC)

```mermaid
graph LR
    subgraph Roles["User Roles"]
        DEV["dev<br/>(Developer)"]
        ADM["admin<br/>(Institution Admin)"]
        TCH["teacher"]
        HOD["hod"]
        PRN["principal"]
        STD["student"]
        PAR["parent"]
        ACC["accountant"]
        LIB["librarian"]
        DRV["driver"]
    end

    subgraph Guards["Middleware Guards"]
        G1["authenticate"]
        G2["requireDeveloper"]
        G3["requireAdmin"]
        G4["requireTeacherOrAdmin"]
        G5["requireStaff"]
        G6["requireRole(...)"]
    end

    subgraph Access["API Access Matrix"]
        A1["DEV: /developer/*"]
        A2["ADM: /admin/* (CRUD all)"]
        A3["TCH: /admin/attendance/*<br/>/admin/marks/*<br/>/admin/timetable/*"]
        A4["STD: /admin/attendance/history/student<br/>/admin/marks/me<br/>/admin/my/documents"]
        A5["PAR: /admin/attendance/history/parent<br/>/admin/marks/parent<br/>/admin/timetable/parent"]
    end

    DEV --> G1 --> G2 --> A1
    ADM --> G1 --> G3 --> A2
    TCH --> G1 --> G4 --> A3
    HOD --> G1 --> G4 --> A3
    PRN --> G1 --> G5 --> A3
    STD --> G1 --> G6 --> A4
    PAR --> G1 --> G6 --> A5
```

| Guard | Allowed Roles |
|-------|--------------|
| `authenticate` | Any valid token |
| `requireDeveloper` | `dev` |
| `requireAdmin` | `admin` |
| `requireTeacherOrAdmin` | `admin`, `teacher`, `hod` |
| `requireStaff` | `admin`, `hod`, `principal`, `teacher` |
| `requireRole(...)` | Custom list per endpoint |

---

## 5. API Route Map (93 Endpoints)

```mermaid
graph TB
    subgraph Auth["/api/v1/auth (3)"]
        A1["POST /login-sync"]
        A2["POST /logout"]
        A3["POST /change-password"]
    end

    subgraph Users["/api/v1/users (2)"]
        U1["GET /me"]
        U2["POST /complete-profile"]
    end

    subgraph Admin["/api/v1/admin — Users & Config (23)"]
        AD1["GET /institution-config"]
        AD2["PUT /institution-config"]
        AD3["GET /dashboard-stats"]
        AD4["GET /students"]
        AD5["GET /students/alumni"]
        AD6["GET /students/:id"]
        AD7["POST /students"]
        AD8["PUT /students/:id"]
        AD9["DELETE /students/:id"]
        AD10["POST /students/promote"]
        AD11["POST /students/graduate"]
        AD12["GET /students/:id/documents"]
        AD13["POST /students/:id/documents"]
        AD14["DELETE /students/:id/documents/:docId"]
        AD15["GET /my/documents"]
        AD16["POST /my/documents"]
        AD17["DELETE /my/documents/:docId"]
        AD18["GET /teachers"]
        AD19["POST /teachers"]
        AD20["PUT /teachers/:id"]
        AD21["DELETE /teachers/:id"]
        AD22["GET /users"]
        AD23["POST /users"]
    end

    subgraph Academics["/api/v1/admin — Academics (45)"]
        AC1["GET/POST /class-sections"]
        AC2["PUT/DELETE /class-sections/:id"]
        AC3["GET/POST /subjects"]
        AC4["GET/POST/PUT/DELETE /subject-teachers"]
        AC5["GET/POST /periods"]
        AC6["PUT /config/terms"]
        AC7["PUT /config/holidays"]
        AC8["POST /timetable"]
        AC9["GET /timetable/class"]
        AC10["GET /timetable/teacher"]
        AC11["GET /timetable/me"]
        AC12["GET /timetable/my-class"]
        AC13["GET /timetable/class/:id/versions"]
        AC14["GET /timetable/parent"]
        AC15["GET /attendance/roster"]
        AC16["POST /attendance/mark"]
        AC17["GET /attendance/slot"]
        AC18["GET /attendance/history/student"]
        AC19["GET /attendance/history/parent"]
        AC20["GET /attendance/stats/department"]
        AC21["GET /attendance/stats/institution"]
        AC22["GET /attendance/class"]
        AC23["GET /attendance/export"]
        AC24["GET /attendance/report"]
        AC25["GET/POST /exams"]
        AC26["GET/PUT /exams/:id"]
        AC27["GET/POST /marks"]
        AC28["GET /marks/student/:id"]
        AC29["GET /marks/me"]
        AC30["GET /marks/parent"]
        AC31["GET /homework"]
        AC32["POST /homework"]
        AC33["GET /homework/:id"]
        AC34["PUT /homework/:id"]
        AC35["DELETE /homework/:id"]
        AC36["GET /homework/student/:studentId"]
        AC37["GET /homework/parent"]
        AC38["GET /class-subjects"]
    end

    subgraph Institutions["/api/v1/institutions (5)"]
        I1["POST /"]
        I2["GET /"]
        I3["GET /:id"]
        I4["PUT /:id"]
        I5["DELETE /:id"]
    end

    subgraph Developer["/api/v1/developer (9)"]
        D1["POST /institutions"]
        D2["GET /institutions"]
        D3["GET /institutions/:id"]
        D4["PUT /institutions/:id"]
        D5["DELETE /institutions/:id"]
        D6["GET /stats"]
        D7["GET /admins"]
        D8["POST /admins"]
        D9["PUT/DELETE /admins/:id"]
    end
```

---

## 6. Attendance Flow

```mermaid
sequenceDiagram
    participant ADM as Admin
    participant TCH as Teacher
    participant STD as Student
    participant PAR as Parent
    participant API as Fastify API
    participant DB as PostgreSQL

    Note over ADM,DB: Setup Phase
    ADM->>API: POST /class-sections (create class)
    ADM->>API: POST /subjects (create subjects)
    ADM->>API: POST /subject-teachers (assign teacher)
    ADM->>API: POST /periods (create time slots)
    ADM->>API: POST /timetable (build weekly timetable)
    ADM->>API: POST /students (create students)
    ADM->>API: POST /students/promote (enroll in class)

    Note over TCH,DB: Daily Attendance
    TCH->>API: GET /timetable/me?date=2026-09-05
    API-->>TCH: Today's slots [{slotId, class, subject, period}]

    TCH->>API: GET /attendance/roster?timetableSlotId=ts_xxx
    API->>DB: Query student_classes WHERE class_section_id = ?
    DB-->>API: [{studentId, name, rollNo}]
    API-->>TCH: Roster with students

    loop For each student
        TCH->>API: Toggle present/absent/late/excused
    end

    TCH->>API: POST /attendance/mark<br/>{timetableSlotId, date, entries: [{studentId, status, remarks}]}
    API->>DB: INSERT attendance_records (1 per slot+date)
    API->>DB: INSERT attendance_entries (1 per student)
    DB-->>API: Saved
    API-->>TCH: 200 OK

    Note over STD,PAR: View Attendance
    STD->>API: GET /attendance/history/student?fromDate=&toDate=
    API->>DB: Query attendance_entries JOIN records JOIN slots
    DB-->>API: [{date, subject, status, remarks}]
    API-->>STD: Attendance history

    PAR->>API: GET /attendance/history/parent
    API->>DB: Resolve linkedStudentUSN → student_id
    API->>DB: Query attendance for linked student
    DB-->>API: Attendance data
    API-->>PAR: Child's attendance

    Note over TCH,DB: Reports & Export
    TCH->>API: GET /attendance/report?classSectionId=cs_xxx
    API->>DB: getClassAttendanceReport()
    DB-->>API: {summary, subjects, dailyTrend, lowAttendance, topPerformers}
    API-->>TCH: Report data

    TCH->>API: GET /attendance/export?classSectionId=cs_xxx
    API->>DB: exportClassAttendanceCsv()
    DB-->>API: CSV string
    API-->>TCH: CSV file download
```

---

## 7. Marks & Exam Flow

```mermaid
sequenceDiagram
    participant ADM as Admin/Teacher
    participant TCH as Teacher
    participant STD as Student
    participant PAR as Parent
    participant API as Fastify API
    participant DB as PostgreSQL

    Note over ADM,DB: Exam Setup (Admin Only)
    ADM->>API: POST /exams<br/>{name, term, academicYear, subjects: [{subjectId, maxMarks, passMarks}]}
    API->>DB: INSERT exams + exam_subjects
    API-->>ADM: Exam created (status: draft)

    ADM->>API: PUT /exams/:id {status: "published"}
    API->>DB: UPDATE exam status
    API-->>ADM: Exam published

    Note over TCH,DB: Marks Entry (Teacher)
    TCH->>API: GET /exams?status=published
    API-->>TCH: List of published exams

    TCH->>API: GET /marks?examSubjectId=es_xxx&classSectionId=cs_xxx
    API->>DB: Query marks for exam-subject-class
    DB-->>TCH: [{studentId, name, marksObtained, grade, remarks}]

    loop For each student
        TCH->>API: Enter marks (0-100 or grade)
    end

    TCH->>API: POST /marks<br/>{examSubjectId, classSectionId, entries: [{studentId, marksObtained, grade, remarks}]}
    API->>DB: UPSERT marks (INSERT or UPDATE)
    DB-->>API: Saved
    API-->>TCH: 200 OK

    Note over STD,PAR: View Marks
    STD->>API: GET /marks/me
    API->>DB: Query marks WHERE student_id = current user
    DB-->>API: [{exam, subject, marks, grade, maxMarks, passMarks}]
    API-->>STD: Marks with pass/fail indicators

    PAR->>API: GET /marks/parent
    API->>DB: Resolve linked student → query marks
    DB-->>API: Child's marks
    API-->>PAR: Child's marks

    Note over TCH,DB: Lock Exam (Finalize)
    ADM->>API: PUT /exams/:id {status: "locked"}
    API->>DB: UPDATE exam status (no more edits)
```

---

## 8. Homework Flow

```mermaid
sequenceDiagram
    participant TCH as Teacher
    participant STD as Student
    participant PAR as Parent
    participant API as Fastify API
    participant DB as PostgreSQL

    Note over TCH,DB: Create Homework (Teacher)
    TCH->>API: POST /homework<br/>{classSectionId, subjectId, title, description, dueDate, priority}
    API->>DB: INSERT homework
    API-->>TCH: 201 Created

    Note over STD: View Homework (Student)
    STD->>API: GET /homework?classSectionId=cs_xxx
    API->>DB: Query homework WHERE class_section_id = ? AND status = 'active'
    DB-->>API: [{id, title, subject, dueDate, priority, status}]
    API-->>STD: Homework list

    Note over PAR: View Child's Homework (Parent)
    PAR->>API: GET /homework/parent
    API->>DB: Resolve linkedStudentUSN → classSectionId
    API->>DB: Query homework for child's class
    DB-->>API: [{id, title, subject, dueDate, priority}]
    API-->>PAR: Child's homework

    Note over TCH: Manage Homework (Teacher)
    TCH->>API: PUT /homework/:id<br/>{status: 'completed'}
    API->>DB: UPDATE homework status
    API-->>TCH: 200 OK

    TCH->>API: DELETE /homework/:id
    API->>DB: DELETE homework
    API-->>TCH: 200 OK
```

---

## 9. Timetable Flow

```mermaid
sequenceDiagram
    participant ADM as Admin
    participant TCH as Teacher
    participant STD as Student
    participant API as Fastify API
    participant DB as PostgreSQL

    Note over ADM,DB: Build Timetable
    ADM->>API: POST /periods<br/>{label: "Period 1", startTime: "09:00", endTime: "09:45"}
    ADM->>API: POST /class-sections<br/>{name: "10-A", department: "Science"}
    ADM->>API: POST /subjects<br/>{name: "Mathematics", code: "MATH"}
    ADM->>API: POST /subject-teachers<br/>{classSectionId, subjectId, teacherId}

    ADM->>API: POST /timetable<br/>{classSectionId, academicYear, term, effectiveFrom, slots: [{dayOfWeek, periodId, subjectId, teacherId, room}]}
    API->>DB: INSERT timetables (version auto-increment)
    API->>DB: INSERT timetable_slots (1 per slot)
    DB-->>API: Timetable created (version N)
    API-->>ADM: 200 OK

    Note over TCH,STD: View Timetable
    TCH->>API: GET /timetable/me?date=2026-09-05
    API->>DB: Find timetable WHERE class_section_id = teacher's class AND version = latest
    API->>DB: Filter slots WHERE day_of_week = today
    DB-->>API: [{period, subject, class, room, time}]
    API-->>TCH: Today's schedule

    STD->>API: GET /timetable/class?classSectionId=cs_xxx&date=2026-09-05
    API->>DB: Same logic for student's class
    DB-->>API: Class schedule
    API-->>STD: Today's timetable

    Note over ADM,TCH: Version Control
    ADM->>API: PUT /timetable (new version)
    API->>DB: INSERT new timetable with version = prev + 1
    Note: Old version preserved for historical data
```

---

## 10. Frontend Component Architecture

```mermaid
graph TB
    subgraph Root["app/_layout.tsx"]
        NAV["Navigation Container"]
        FONT["Poppins Font (Global)"]
        AUTH_GUARD["ProtectedRoute"]
    end

    subgraph Shared["features/shared/"]
        SH1["AppButton, AppInput, AppCard"]
        SH2["AppModal, AppBadge, AppLayout"]
        SH3["LoadingView, EmptyState, ErrorState"]
        SH4["ProtectedRoute, Logo"]
        SH5["useAuthGuard, useAppSync"]
        SH6["usePushNotifications"]
        SH7["permissions.ts, routeGuards.ts"]
    end

    subgraph Auth["features/auth/"]
        LF["LoginForm"]
        CPF["ChangePasswordForm"]
    end

    subgraph Dev["features/developer/"]
        DD["DeveloperDashboardContent"]
        DI["InstitutionCard, InstitutionListScreen"]
        DA["DeveloperAdminsContent"]
        DH["DeveloperHeader"]
        DM["CreateInstitutionModal"]
    end

    subgraph Admin["features/admin/"]
        AH["AdminHomeHeader, AdminHomeModulesGrid"]
        AF["AdminHomeFeedBanner"]
        AFE["AdminHomeFeesOverview"]
        AD["AdminDashboardView"]
        AS["AdminStudentsView"]
        AT["AdminTeachersView"]
        AU["AdminUsersView"]
        AA["AdminAcademicsView"]
        AAT["AdminAttendanceView"]
        AM["AdminTimetableView"]
        AI["AdminInstitutionView"]
        AP["AdminProfileView"]
        ADS["AdminDrawer"]
    end

    subgraph Teacher["features/teacher/"]
        TH["TeacherHomeHeader"]
        TDP["TeacherDonutCard"]
        TWB["TeacherWeeklyBarCard"]
        TPL["TeacherHomePeriodsList"]
        TA["TeacherHomeAnnouncements"]
        TTV["TeacherTimetableView"]
        AMV["AttendanceMarkingView"]
        CAR["ClassAttendanceReport"]
        TTB["ClassTeacherTimetableBuilder"]
        THV["TeacherHomeworkView"]
        TCV["TeacherChatView"]
        TLS["TeacherLocateStudentsView"]
        TDR["TeacherDrawer"]
    end

    subgraph Student["features/student/"]
        SH["StudentHomeHeader"]
        SAC["StudentHomeAttendanceCard"]
        SAP["StudentHomePeriodsList"]
        SAN["StudentHomeAnnouncements"]
        SATV["StudentTimetableView"]
        SAV["StudentAttendanceView"]
        SMV["StudentMarksView"]
        SBT["StudentBusTrackingView"]
        SHWV["StudentHomeworkView"]
        SDR["StudentDrawer"]
        SKEL["ShimmerSkeleton + skeletons/"]
    end

    subgraph Parent["features/parent/"]
        PH["ParentHomeHeader"]
        PHD["ParentHomeDashboard"]
        PAV["ParentAttendanceView"]
        PMV["ParentMarksView"]
        PTR["ParentTrackView"]
        PHWV["ParentHomeworkView"]
        PDR["ParentDrawer"]
    end

    subgraph Other["Other Roles"]
        DRV["DriverTripsView, DriverDrawer"]
        PRN["PrincipalCompleteProfileForm"]
        HOD_F["HODCompleteProfileForm"]
        LIB_F["LibrarianCompleteProfileForm"]
        ACC_F["AccountantCompleteProfileForm"]
    end

    Root --> Auth
    Root --> Shared
    Auth --> Dev
    Auth --> Admin
    Auth --> Teacher
    Auth --> Student
    Auth --> Parent
    Auth --> Other
```

---

## 11. Data Flow by Role

```mermaid
graph LR
    subgraph Developer["Developer"]
        D1["Manage Institutions"]
        D2["Manage Admins"]
        D3["View Revenue Stats"]
        D1 --> D2 --> D3
    end

    subgraph Admin["Admin"]
        A1["Manage Students"]
        A2["Manage Teachers"]
        A3["Manage Classes & Subjects"]
        A4["Build Timetable"]
        A5["Create Exams"]
        A6["View Dashboard"]
        A1 & A2 --> A3 --> A4
        A3 --> A5
        A1 & A2 & A4 --> A6
    end

    subgraph Teacher["Teacher"]
        T1["View Timetable"]
        T2["Mark Attendance"]
        T3["Enter Marks"]
        T4["View Reports"]
        T5["Create Homework"]
        T6["Chat with Parents"]
        T7["Locate Students"]
        T1 --> T2
        T1 --> T3
        T2 --> T4
        T1 --> T5
        T5 --> T6
        T2 --> T7
    end

    subgraph Student["Student"]
        S1["View Schedule"]
        S2["View Attendance"]
        S3["View Marks"]
        S4["Track Bus"]
        S5["Upload Documents"]
        S6["View Homework"]
        S1 --> S2
        S2 --> S3
        S1 --> S6
    end

    subgraph Parent["Parent"]
        P1["Select Child"]
        P2["View Child Attendance"]
        P3["View Child Marks"]
        P4["Track Child Bus"]
        P5["View Child Homework"]
        P1 --> P2 --> P3
        P1 --> P4
        P1 --> P5
    end
```

---

## 12. Technology Stack

```mermaid
graph TB
    subgraph Frontend["Frontend"]
        RN["React Native 0.81.5"]
        EXPO["Expo SDK 54"]
        ROUTER["Expo Router v6"]
        ZUSTAND["Zustand 5.x (State)"]
        RQ["TanStack React Query 5.x"]
        NATIVEWIND["NativeWind (Tailwind)"]
        REANIMATED["react-native-reanimated"]
        SVG["react-native-svg (Charts)"]
        FONT["Poppins (@expo-google-fonts)"]
        FIREBASE["Firebase Auth SDK"]
    end

    subgraph Backend["Backend"]
        FASTIFY["Fastify"]
        TS["TypeScript 5.9"]
        DRIZZLE["Drizzle ORM"]
        PG["PostgreSQL"]
        ZOD["Zod (Validation)"]
        FIREBAE_ADMIN["Firebase Admin SDK"]
    end

    subgraph External["External Services"]
        FIREBASE_AUTH["Firebase Authentication"]
        FIREBASE_STORAGE["Firebase Storage"]
        FIREBASE_ANALYTICS["Firebase Analytics"]
    end

    RN --> EXPO --> ROUTER
    ZUSTAND --> RN
    RQ --> RN
    SVG --> RN
    FONT --> RN
    FIREBASE --> RN

    FASTIFY --> TS --> DRIZZLE --> PG
    ZOD --> FASTIFY
    FIREBAE_ADMIN --> FASTIFY
    FIREBASE_AUTH --> FIREBAE_ADMIN
    FIREBASE_STORAGE --> FIREBAE_ADMIN
```

---

## 13. File Count Summary

| Layer | Files |
|-------|-------|
| **Server — Routes** | 6 files, 93 endpoints |
| **Server — Controllers** | 6 files, 86 handlers |
| **Server — Services** | 6 files |
| **Server — Repositories** | 5 files |
| **Server — Schema** | 1 file, 16 tables, 30+ indexes |
| **Server — Middleware** | 2 files, 6 guards |
| **Frontend — App Routes** | 30 route files (10 role groups) |
| **Frontend — Features** | 10 feature directories, 76+ components |
| **Frontend — API Client** | 5 files, 60+ exported functions |
| **Frontend — Stores** | 2 Zustand stores |
| **Frontend — Shared** | 12 components, 3 hooks, 2 utils |
| **Database** | 16 tables, 28 relations, 2 migrations |

---

## 14. Color & Design System

```mermaid
graph LR
    subgraph Theme["Theme Constants"]
        P["Primary: #F4C430<br/>(Gold)"]
        S["Secondary: #171717<br/>(Near Black)"]
        B["Border: #E8E5DC<br/>(Warm Gray)"]
        C["Card BG: #FFFEFE<br/>(Off White)"]
        D["Dark: #1A1B1C<br/>(Teacher Cards)"]
        BG["Background: #FFFEFE"]
    end

    subgraph Fonts["Typography"]
        F1["Poppins 400 — Regular"]
        F2["Poppins 500 — Medium"]
        F3["Poppins 600 — SemiBold"]
        F4["Poppins 700 — Bold"]
        F5["Poppins 800 — ExtraBold"]
    end

    subgraph BorderRadius["Border Radius"]
        BR1["input: 6"]
        BR2["button: 7"]
        BR3["card: 8"]
        BR4["modal: 10"]
        BR5["bottomSheet: 12"]
    end
```
