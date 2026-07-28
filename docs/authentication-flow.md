# Authentication

## Purpose

This document defines how users are created, authenticated, and activated within the School ERP platform.

Authentication verifies a user's identity.

Authorization determines what the user is allowed to access.

The platform uses Firebase Authentication for identity management and PostgreSQL as the source of truth for application data.

---

# Supported User Types

The platform supports authentication for:

- Institution Administrator
- Teacher
- Student

The Developer Console is a separate web application and follows its own authentication mechanism.

---

# User Creation

Users are never allowed to register themselves.

Every account is created by the system.

Developer
    ↓
Creates Institution Administrator

Institution Administrator
    ↓
Creates Teachers

Institution Administrator
    ↓
Creates Students

Every account belongs to exactly one institution.

---

# Institution Administrator Creation

The Developer creates an Institution Administrator during institution onboarding.

The system:

- Creates a Firebase Authentication account
- Creates the corresponding PostgreSQL user
- Associates the user with the institution
- Generates a temporary password

The Institution Administrator receives login credentials.

---

# Teacher Creation

Teachers are created by the Institution Administrator.

Teachers may be created:

- Individually
- Through CSV Import

The system creates:

- Firebase Authentication account
- PostgreSQL teacher record

Each teacher belongs to exactly one institution.

---

# Student Creation

Students are created by the Institution Administrator.

Students may be created:

- Individually
- Through CSV Import

The system creates:

- Firebase Authentication account
- PostgreSQL student record

Each student belongs to exactly one institution.

---

# First Login

Every newly created account receives a temporary password.

During the first login:

Login
    ↓
Verify Credentials
    ↓
Force Password Change
    ↓
Complete Profile (if required)
    ↓
Dashboard

Users cannot continue using the application until the temporary password has been changed.

---

# Login

Users authenticate using:

- Email
- Password

Firebase Authentication verifies identity.

After successful authentication:

- Firebase returns an ID Token.
- The mobile application sends the token to the backend.
- The backend verifies the token.
- The backend loads the corresponding user from PostgreSQL.
- The backend determines the user's role and institution.
- Access is granted.

---

# Password Reset

Users who forget their password may reset it using Firebase Authentication.

The ERP does not manage password recovery directly.

---

# User Status

A user may have one of the following statuses:

- Active
- Inactive
- Suspended

Inactive or suspended users cannot access the platform even if Firebase successfully authenticates them.

Application access is determined using PostgreSQL.

---

# Institution Validation

Every authenticated user belongs to exactly one institution.

All application data is filtered using the user's institution.

Users cannot access data belonging to another institution.

---

# Security Principles

Authentication confirms identity.

Authorization controls access.

Firebase Authentication is responsible for identity verification.

PostgreSQL is responsible for application data and business rules.

Both systems work together to provide secure access to the ERP.