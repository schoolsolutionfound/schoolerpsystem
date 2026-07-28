# Institution

## Purpose

An Institution represents a single organization using the School ERP platform.

An institution can be a school, college, university, coaching center, or any educational organization supported by the platform.

Every institution operates independently and has its own administrators, teachers, students, academic structure, and data.

No data is shared between institutions.

---

# Institution Lifecycle

Every institution follows the same onboarding process.

Create Institution
    ↓
Configure Institution
    ↓
Assign Subscription
    ↓
Create Institution Administrator
    ↓
Institution Ready

Only after this process is completed can the institution begin using the ERP.

---

# Institution Information

Every institution stores basic information including:

- Institution Name
- Institution Code
- Institution Type
- Address
- Contact Details
- Logo
- Status

The Institution Code must be unique across the platform.

It is used to identify the institution throughout the system.

---

# Institution Types

The ERP supports multiple institution types.

Examples include:

- School
- College
- University
- Coaching Center

Different institution types may enable different modules in future versions.

---

# Institution Configuration

During onboarding, every institution must be configured before it becomes active.

Configuration includes:

- Departments
- Academic Years
- Courses (if applicable)
- Subscription Plan

These configurations become the foundation for all academic operations.

---

# Departments

Departments belong to an institution.

Examples

Engineering College

- Computer Science
- Electronics
- Mechanical

School

- Science
- Commerce
- Arts

Departments are unique within an institution.

Different institutions may have departments with the same name.

---

# Academic Years

Each institution defines its own academic structure.

Examples

Engineering College

- First Year
- Second Year
- Third Year
- Fourth Year

School

- Class 1
- Class 2
- ...
- Class 10

Academic years belong only to their institution.

---

# Courses

Some institutions organize students using courses.

Examples

- BCA
- BSc
- BCom
- MBA

Schools may not require courses.

Support for courses depends on the institution type.

---

# Subscription

Every institution is associated with a subscription plan.

A subscription contains:

- Plan
- Start Date
- Renewal Date
- Status

Subscription expiry does not immediately disable the institution.

Instead, the Developer receives renewal reminders and decides the appropriate action.

This behavior may evolve in future versions.

---

# Institution Administrator

Every institution must have at least one Institution Administrator.

The Institution Administrator becomes responsible for managing the institution after onboarding.

The Developer is no longer involved in daily academic operations.

---

# Data Isolation

Every record in the ERP belongs to exactly one institution.

Examples include:

- Students
- Teachers
- Attendance
- Marks
- Assignments
- Timetables

Users can only access data belonging to their own institution.

---

# Guiding Principles

An institution owns its own academic structure.

Institutions never share operational data.

Every academic operation in the ERP begins with an institution.

Without an institution, no students, teachers, attendance, or academic records can exist.