Read `specs/00-references.md` before implementing this specification.

# Sprint 02 — Institution Administrator Foundation

## Objective

Build the Institution Administrator workspace inside the existing mobile application.

This sprint establishes the Institution Administration workflow after an Institution has been created through the Developer Console.

The focus of this sprint is enabling Institution Administrators to configure their institution and manually onboard Students and Teachers.

The focus of this sprint is functionality, business workflow, and end-to-end integration—not final UI/UX.

---

# Product Goal

Upon completion of this sprint, an Institution Administrator should be capable of preparing an Institution for ERP usage without requiring further intervention from the Developer.

This includes:

- Managing institution configuration
- Managing academic structure
- Creating Students manually
- Creating Teachers manually
- Preparing users for authentication

---

# Success Criteria

This sprint is considered successful when an Institution Administrator can:

- Login using the existing mobile application.
- Be redirected to the Institution Administrator workspace.
- View and manage institution information.
- Configure the institution's academic structure.
- Create Students manually.
- Create Teachers manually.
- Newly created users can immediately authenticate using the existing mobile application.

---

# Business Context

The School ERP consists of two client applications.

- Developer Console (Web)
- Mobile Application

The Developer is responsible for:

- Creating Institutions
- Creating Institution Administrators

Once an Institution Administrator account has been created, the Developer's responsibility ends.

The Institution Administrator becomes responsible for configuring and managing their Institution.

Institution Administrators can only access data belonging to their assigned Institution.

---

# UI Reference

Reference UI screens for this sprint are located in:

design/
└── Institution-admin/

These reference designs define the intended navigation, user experience, and information hierarchy.

The implementation is **not required** to reproduce the reference screens pixel-for-pixel.

Developers may adapt layouts where appropriate, provided the implemented workflow, navigation, and functionality remain consistent with the reference design.

---

# Scope

## Authentication

Use the existing authentication flow.

Do not create new authentication screens.

Upon successful authentication:

- Institution Administrators shall be redirected to the Institution Administrator workspace.
- Existing role-based navigation shall be used.
- The current authentication implementation shall remain unchanged.

Do not implement:

- Registration
- Forgot Password
- Multi-factor Authentication
- Social Login

---

## Institution Administrator Dashboard

Implement the Institution Administrator landing experience.

The dashboard shall:

- Provide access to Institution Administration features.
- Surface useful high-level institutional information.
- Provide quick access to common administrative operations.

The exact presentation of dashboard information is implementation-defined.

Analytics and reporting are not required.

---

## Institution Management

Implement Institution Management.

Supported operations:

- View Institution information
- Update Institution information where permitted
- View Institution Code
- View Subscription information

Support management of:

- Departments
- Academic Years
- Courses
- Sections

Institution Administrators shall not be able to modify platform-level subscription information.

---

## Student Management

Implement Student Management.

Supported operations:

- View Students
- Search Students
- Filter Students
- Create Student
- Edit Student

Required information includes:

- First Name
- Last Name
- Email
- USN / Roll Number
- Department
- Academic Year
- Section
- Temporary Password

Creating a Student must:

- Create an authentication account.
- Create the corresponding application user.
- Associate the Student with the Institution.
- Require password change on first login.

Student profile completion is outside the scope of this sprint.

---

## Teacher Management

Implement Teacher Management.

Supported operations:

- View Teachers
- Search Teachers
- Filter Teachers
- Create Teacher
- Edit Teacher

Required information includes:

- First Name
- Last Name
- Email
- Employee ID
- Department
- Temporary Password

Creating a Teacher must:

- Create an authentication account.
- Create the corresponding application user.
- Associate the Teacher with the Institution.
- Require password change on first login.

Teacher profile completion is outside the scope of this sprint.

---

## Profile

Implement Institution Administrator profile management.

Support:

- View Profile
- Edit Personal Information
- Change Password
- Logout

Advanced account settings are not required.

---

# Existing Mobile Application

The existing mobile application already provides authentication.

Do not redesign, replace, or duplicate authentication.

This sprint shall extend the existing application by implementing the Institution Administrator workspace after successful authentication.

---

# UI

Follow the existing application theme.

Maintain consistency with the provided reference designs.

UI polish, animations, and visual refinements are outside the scope of this sprint.

Priority shall always be given to:

- Business workflow
- Functionality
- Maintainability
- Integration

---

# Business Rules

- Institution Administrators belong to exactly one Institution.
- Institution Administrators may only access data belonging to their Institution.
- Students belong to exactly one Institution.
- Teachers belong to exactly one Institution.
- Every created Student must have an authentication account.
- Every created Teacher must have an authentication account.
- Every created Student must have an application user record.
- Every created Teacher must have an application user record.
- Every created user must be associated with the Institution.
- Institution data must remain isolated from every other Institution.

---

# Constraints

During this sprint, do NOT implement:

- CSV Import
- Attendance
- Timetable
- Assignments
- Exams
- Marks
- Fees
- Notifications
- Reports
- Analytics
- Messaging
- Parent Management
- Student Dashboard
- Teacher Dashboard
- Additional user roles
- Platform Administration

Do not introduce new business workflows outside the documented product architecture.

Focus only on Institution onboarding through manual management.

---

# Acceptance Criteria

The sprint is complete when:

- Institution Administrator can login.
- Institution Administrator reaches the correct workspace.
- Institution information can be viewed.
- Institution academic structure can be managed.
- Students can be created manually.
- Teachers can be created manually.
- Authentication accounts are successfully created.
- Application users are successfully created.
- Newly created users can login using the existing mobile application.
- No manual database operations are required.

---

# Definition of Done

This sprint is considered complete when:

- All acceptance criteria are satisfied.
- Institution configuration functions end-to-end.
- Student creation functions end-to-end.
- Teacher creation functions end-to-end.
- Newly created users authenticate successfully.
- No mock data is required.
- Existing authentication continues to function.
- Implementation follows project rules and documentation.

---

# Verification Plan

## Manual Verification

1. Login as Institution Administrator.
2. Verify dashboard access.
3. Verify Institution information.
4. Create a Department.
5. Create an Academic Year.
6. Create a Course.
7. Create a Section.
8. Create a Student manually.
9. Create a Teacher manually.
10. Verify users exist in the database.
11. Login using the newly created Student account.
12. Login using the newly created Teacher account.
13. Verify password change flow.
14. Verify Institution isolation.

---

# Implementation Checklist

- [ ] Institution Administrator dashboard implemented
- [ ] Institution management implemented
- [ ] Department management implemented
- [ ] Academic Year management implemented
- [ ] Course management implemented
- [ ] Section management implemented
- [ ] Student management implemented
- [ ] Teacher management implemented
- [ ] Profile management implemented
- [ ] Backend integration completed
- [ ] Validation implemented
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] End-to-end onboarding verified
- [ ] Documentation updated