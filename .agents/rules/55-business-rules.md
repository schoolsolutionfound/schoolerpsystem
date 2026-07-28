---
trigger: always_on
---

# Business Rules & Permission Guidelines

## Purpose

Define the business rules, permission model, and access boundaries for every role within the School ERP System.

Authorization decisions should remain consistent across the frontend and backend.

---

# Role Hierarchy

The application follows a hierarchical permission model.

```
Developer
    ↓
Maintainer
    ↓
Teacher
    ↓
Student
```

Higher roles may perform actions available to lower-level administrative roles only when explicitly permitted by the application's business rules.

---

# Role Responsibilities

## Developer

Scope:
- Entire ERP platform

Responsibilities:

- Manage institutions
- Manage subscriptions
- View system analytics
- Manage maintainers
- Configure platform-wide settings
- Monitor overall system health

The Developer acts as the platform administrator and is not restricted to a single institution.

---

## Maintainer

Scope:
- Assigned institution only

Responsibilities:

- Manage teachers
- Manage students
- Manage departments
- Configure institution settings
- View institution analytics
- Manage academic structures

Maintainers must never access data belonging to another institution.

---

## Teacher

Scope:
- Assigned classes, subjects, and sections

Responsibilities:

- Record attendance
- Upload marks
- View assigned students
- Manage classroom activities
- Access academic information related to assigned responsibilities

Teachers should only access resources assigned to them.

---

## Student

Scope:
- Personal records only

Responsibilities:

- View attendance
- View grades
- View timetable
- View fee status
- View announcements
- Update permitted profile information

Students must never access another student's information.

---

# Permission Principles

Permissions should always follow the principle of least privilege.

Every user should receive only the minimum level of access required to perform their responsibilities.

Never grant broader access for convenience.

---

# Tenant Isolation

Institution boundaries must always be enforced.

Every request should operate within the authenticated user's assigned institution unless the user has platform-level permissions.

Cross-institution data access must never occur accidentally.

---

# Authorization

The backend is the source of truth for authorization.

Never rely solely on frontend role checks to protect resources.

Every protected operation should verify:

- Authentication
- User role
- Institution ownership
- Resource ownership (where applicable)

---
## Business Rule Ownership

Business rules belong inside the Service layer.

Avoid implementing business rules inside:

- Routes
- Controllers
- Repositories
- UI Components

The Service layer is responsible for enforcing workflows, permissions, and domain-specific logic.

---

# Data Protection

Sensitive data should only be returned to users who are explicitly authorized to access it.

Avoid exposing unnecessary fields in API responses.

Return the minimum amount of data required for each operation.

---

# Goal

Maintain a secure, scalable, and predictable permission system that protects institution boundaries while ensuring every role can perform its intended responsibilities.