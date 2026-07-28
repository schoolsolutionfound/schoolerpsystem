Read `specs/00-references.md` before implementing this specification.

# Sprint 01 — Developer Console Foundation

## Objective

Build the initial **Developer Console** as a standalone web application connected to the existing backend.

This sprint establishes the complete institution onboarding workflow and serves as the foundation for all future ERP modules.

The focus of this sprint is functionality, architecture, and end-to-end integration—not final UI/UX.

---

# Success Criteria

This sprint is considered successful when a Developer can:

- Login to the Developer Console.
- Create and configure an Institution.
- Create an Institution Administrator.
- The created Institution Administrator can immediately log into the existing mobile application without any manual database changes.

---

# Business Context

The School ERP consists of two client applications:

- Developer Console (Web)
- Mobile Application

The Developer Console is an internal platform used only by system developers.

The mobile application is used by Institution Administrators, Teachers, and Students.

Both applications share the same backend and database.

The Developer role does not exist inside the mobile application.

---

# Scope

## Developer Authentication

Implement a simple Developer login for the Developer Console.

Requirements

- Email and Password authentication.
- Authenticate the Developer.
- Redirect authenticated users to the Developer Dashboard.

Do not implement:

- Registration
- Forgot Password
- Profile Management
- Social Login
- Multi-factor Authentication

The authentication flow should remain simple for this sprint.

---

## Developer Dashboard

Implement a functional dashboard.

The dashboard should provide navigation to:

- Dashboard
- Institutions
- Institution Administrators
- Subscription Plans
- Settings

Statistics, charts, analytics, and dashboard widgets are not required during this sprint.

---

## Institution Management

Implement Institution Management.

Supported operations:

- View Institutions
- Create Institution
- Edit Institution

Institution configuration must support:

- Institution Name
- Institution Code
- Institution Type
- Departments
- Academic Years
- Courses (Optional)
- Subscription Plan

These values form the institution's initial academic configuration.

---

## Institution Administrator Management

Implement Institution Administrator Management.

Supported operations:

- View Institution Administrators
- Create Institution Administrator

Required information:

- Full Name
- Email
- Phone Number (Optional)
- Institution
- Temporary Password

Creating an Institution Administrator must:

- Create an authentication account.
- Create the corresponding application user.
- Associate the user with the selected institution.
- Require a password change on first login.

---

# Existing Mobile Application

The mobile authentication interface already exists.

Do not redesign, rebuild, or duplicate the authentication screens.

This sprint should integrate the existing authentication flow with data created by the Developer Console.

The Institution Administrator created through the Developer Console must be able to authenticate successfully using the current mobile application.

---

# UI

The current objective is to produce a working system.

Follow the existing project theme.

Keep the interface clean, simple, and functional.

UI polish, animations, and design improvements will be handled in future sprints.

---

# Business Rules

- Every Institution must have a unique Institution Code.
- Every Institution belongs to the School ERP platform.
- Every Institution must have at least one Institution Administrator.
- Every Institution Administrator belongs to exactly one Institution.
- Institution Administrators cannot exist without an Institution.
- Institution data is isolated from every other Institution.

---

# Constraints

During this sprint:

Do NOT implement:

- Student Management
- Teacher Management
- Attendance
- Reports
- Notifications
- Analytics
- Role Management
- Subscription Billing
- Mobile UI redesign
- Additional dashboards
- Future modules

Do not introduce new roles or business workflows outside the documented product architecture.

Focus only on the Institution onboarding workflow.

---

# Acceptance Criteria

The sprint is complete when:

- Developer can log into the Developer Console.
- Developer can create an Institution.
- Institution data is successfully persisted.
- Developer can edit Institution information.
- Developer can create an Institution Administrator.
- Institution Administrator authentication is successfully created.
- Institution Administrator application data is successfully created.
- Institution Administrator can log into the existing mobile application.
- Institution Administrator is redirected to the appropriate dashboard.

---

# Definition of Done

This sprint is considered complete when:

- All acceptance criteria are satisfied.
- The complete onboarding workflow functions without manual intervention.
- No mock data is required for the implemented workflow.
- The Developer Console communicates with the existing backend.
- The existing mobile authentication flow works with newly created Institution Administrators.
- The implementation follows the project rules and documentation.

---

# Verification Plan

## Manual Verification

1. Login to the Developer Console.
2. Create a new Institution.
3. Verify the Institution has been persisted.
4. Create an Institution Administrator.
5. Verify the Institution Administrator has been created successfully.
6. Open the existing mobile application.
7. Login using the newly created Institution Administrator.
8. Verify successful authentication and dashboard redirection.

---

# Implementation Checklist

- [ ] Developer authentication implemented
- [ ] Developer dashboard implemented
- [ ] Institution Management implemented
- [ ] Institution Administrator Management implemented
- [ ] Backend integration completed
- [ ] Validation implemented
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] End-to-end onboarding verified
- [ ] Documentation updated