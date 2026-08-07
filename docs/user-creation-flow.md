# User Creation Flow

## Role Hierarchy

```
Dev (Super Admin / Maintainer)
 └── Creates Institutions (schools / colleges)
 └── Creates Institution Admins
       └── Creates Students
       └── Creates Teachers
```

## All Roles (shared across school & college)

`dev`, `admin`, `teacher`, `student`, `parent`, `principal`, `accountant`, `hod`, `librarian`, `maintainer`

---

## Step 1: Dev creates an institution

**Source**: `developer-console/src/views/InstitutionsView.tsx`
**API**: `POST /api/v1/developer/institutions`
**Server**: `developer.service.ts → createInstitution()`

Fields: institutionName, institutionCode (e.g. `GIS001`), institutionType (`school`/`college`), departments, academicYears, courses, subscriptionStatus.

---

## Step 2: Dev creates an admin for that institution

**Source**: `developer-console/src/views/AdminsView.tsx`
**API**: `POST /api/v1/developer/admins`
**Server**: `developer.service.ts → createAdmin()`

- Creates Firebase Auth account with the provided password (default: `TempPass123!`)
- Creates PostgreSQL record with role=`admin`, linked to the institution code
- Admin can log into the mobile app with email + password

---

## Step 3: Admin creates students & teachers

**Source**: `app/(admin)/home.tsx` (mobile app)
**Server**: `admin.service.ts`

### Student
**API**: `POST /api/v1/admin/students`
**Server**: `admin.service.ts → createStudent()`

Required: firstName, lastName, email, rollNoOrUSN
Optional: department, academicYear, section, password (default: `TempPass123!`)

### Teacher
**API**: `POST /api/v1/admin/teachers`
**Server**: `admin.service.ts → createTeacher()`

Required: firstName, lastName, email
Optional: employeeId, department, password (default: `TempPass123!`)

Both create Firebase Auth accounts + PostgreSQL records with `mustChangePassword: true`.
