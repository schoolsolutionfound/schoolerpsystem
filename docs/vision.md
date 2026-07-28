# Vision

## Overview

School ERP is a centralized institution management platform designed to help educational institutions manage their academic operations through a unified ecosystem.

The platform consists of multiple applications that work together while sharing the same backend and database.

The Developer Console is responsible for onboarding institutions.

Institution Administrators manage the operational data of their institution.

Teachers perform academic activities.

Students access their own academic information.

Every feature in the platform should support this ecosystem.

---

## Product Goals

The platform aims to:

- Simplify institution onboarding
- Centralize academic management
- Reduce manual administrative work
- Provide a consistent experience across institutions
- Scale to support multiple schools and colleges

---

## Applications

The ecosystem consists of:

### Developer Console (Web)

Used only by platform developers.

Purpose:

- Create institutions
- Configure institutions
- Manage subscriptions
- Create Institution Administrators

The Developer Console never manages teachers or students directly.

---

### Institution App

Used by Institution Administrators.

Purpose:

- Configure institution
- Manage teachers
- Manage students
- Import CSV data
- Configure academic structure

---

### Teacher App

Used by teachers.

Purpose:

- Attendance
- Marks
- Assignments
- Student communication

---

### Student App

Used by students.

Purpose:

- View attendance
- View marks
- View timetable
- View assignments
- Complete profile