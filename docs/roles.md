# Roles

## Purpose

This document defines every role in the School ERP ecosystem.

Each role has a clearly defined responsibility.

A role describes **what a user is responsible for**, not how permissions are implemented.

Permission enforcement is documented separately.

---

# Role Hierarchy

Developer
    ↓
Institution Admin
    ↓
Teacher
    ↓
Student

---

# Developer

## Purpose

The Developer manages the ERP platform and onboards institutions into the system.

The Developer is responsible for platform administration, not daily academic operations.

## Responsibilities

- Create institutions
- Configure institution details
- Configure departments
- Configure academic years
- Configure institution plans
- Create Institution Administrators
- Monitor institution status
- Maintain the overall ERP platform

## Does NOT Manage

The Developer does not directly manage:

- Students
- Teachers
- Attendance
- Marks
- Assignments
- Timetables

These responsibilities belong to the Institution Administrator.

---

# Institution Administrator

## Purpose

The Institution Administrator manages the complete academic operation of a single institution.

This role acts as the bridge between the ERP platform and the institution.

## Responsibilities

Institution Setup

- Configure institution information
- Manage departments
- Manage academic years
- Manage courses (if applicable)

User Management

- Import students using CSV
- Import teachers using CSV
- Add individual students
- Add individual teachers

Academic Management

- Assign teachers
- Manage student records
- Configure academic structure

Monitoring

- Review attendance
- Review reports
- Manage institution settings

---

# Teacher

## Purpose

Teachers perform daily academic activities.

## Responsibilities

- Mark attendance
- Manage assigned classes
- Upload marks
- Create assignments
- View assigned students
- Communicate with students (future)

Teachers only manage data related to their assigned responsibilities.

---

# Student

## Purpose

Students access their own academic information.

## Responsibilities

- Complete profile
- Change temporary password
- View attendance
- View marks
- View timetable
- View assignments
- View notifications

Students cannot modify institutional academic data.

---

# Parent (Future)

## Purpose

Parents monitor their child's academic progress.

## Responsibilities

- View attendance
- View marks
- View fee status
- Receive notifications

Parents have read-only access.

---

# Future Roles

Future versions of the platform may introduce additional roles such as:

- Accountant
- Librarian
- Transport Manager
- Hostel Warden
- Principal
- Examination Officer

These roles will be defined when their modules are introduced.

---

# Guiding Principle

Every role should have a single, well-defined responsibility.

Responsibilities should not overlap unless explicitly required by the business workflow.

New roles should only be introduced when an existing role cannot reasonably fulfill the required responsibilities.