---
trigger: always_on
---

# Routing & Navigation Standards

## Purpose

Maintain a predictable, centralized, and scalable navigation architecture throughout the application.

Navigation should remain consistent regardless of the number of modules or user roles.

---

# Routing Architecture

The application uses **Expo Router** for file-based navigation.

Responsibilities of the `app/` directory include:

- Route definitions
- Route groups
- Layouts
- Navigation flow

Business logic should remain inside feature modules.

---

# Route Groups

Organize application modules using route groups.

Examples include:

- Developer
- Maintainer
- Teacher
- Student

Each module should remain isolated while sharing the application's common navigation structure.

---

# Layouts

Each route group may define its own layout for:

- Navigation stacks
- Screen headers
- Shared UI
- Route protection
- Module-specific navigation

Avoid duplicating layout logic across screens.

---

# Centralized Role Routing

Role-based navigation should be handled through a single shared routing utility.

Examples include:

- Initial app launch
- Login success
- Session restoration
- Authentication guards

Avoid implementing role checks directly inside individual screens.

Maintain a single source of truth for role-based navigation.

---

# Authentication Flow

The routing flow should remain consistent:

```
Application Launch
        ↓
Authentication Check
        ↓
Role Resolution
        ↓
Role-Based Dashboard
```

Unauthenticated users should always be redirected to the authentication flow.

Authenticated users should be redirected to the appropriate dashboard based on their assigned role.

---

# Navigation Rules

- Keep navigation logic centralized.
- Avoid scattered role checks.
- Avoid hardcoded navigation decisions throughout the application.
- Prefer shared routing utilities over inline conditions.
- Maintain predictable navigation behavior across all modules.

---

# Deep Linking

When introducing deep links or external navigation, ensure they integrate with the existing routing architecture rather than bypassing authentication or role resolution.

---

# Goal

The routing system should provide a consistent, centralized, and maintainable navigation experience that scales as additional modules and user roles are introduced.