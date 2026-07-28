---
trigger: always_on
---

# Authentication & Security Standards

## Purpose

Provide a secure, centralized, and consistent authentication system that protects application resources while enforcing role-based access control.

Authentication and authorization should always follow the project's established architecture.

---

# Authentication Architecture

Authentication should follow a centralized flow:

```
User Login
    ↓
Identity Provider
    ↓
Access Token
    ↓
API Client
    ↓
Backend Authentication
    ↓
Role Resolution
    ↓
Authorized Request
```

The frontend is responsible for authenticating the user.

The backend is responsible for verifying identity and determining permissions.

---

# Authentication Responsibilities

### Frontend

The frontend should:

- Authenticate users
- Maintain the authenticated session
- Attach access tokens through the shared API client
- Never make authorization decisions based solely on client-side state

---

### Backend

The backend is the source of truth for:

- Identity verification
- Role resolution
- Permission enforcement
- Protected resource access

Never trust client-provided roles or permissions.

---

# Role-Based Access Control

Every authenticated request should resolve the user's role from the backend before authorizing access.

Authorization decisions should be centralized and reusable.

Avoid implementing permission checks directly inside business logic whenever middleware or dedicated authorization utilities can enforce them consistently.

---

# Session Management

Authentication tokens should be:

- Retrieved securely
- Sent only through authorized requests
- Refreshed when required
- Invalidated on logout

Avoid manually managing authentication headers outside the shared API layer.

---

# Security Principles

Never:

- Store raw passwords
- Store authentication secrets in plain text
- Hardcode credentials
- Expose internal authentication logic
- Trust client-side authorization

Sensitive operations should always be validated by the backend.

---

# Authentication Flow

The application should maintain a consistent authentication lifecycle:

```
Login
    ↓
Token Acquisition
    ↓
Authenticated API Requests
    ↓
Backend Verification
    ↓
Role Resolution
    ↓
Authorized Resource Access
```

Routing decisions should occur only after successful authentication and role resolution.

---

# Goal

Maintain a secure authentication architecture where identity is verified centrally, authorization is enforced consistently, and sensitive security decisions always remain on the backend.