---
trigger: always_on
---

# Project Structure Standards

## Purpose

Maintain a consistent, feature-first project structure that is easy to navigate, extend, and maintain as the ERP grows.

---

# Frontend Structure

The frontend follows a feature-based architecture.

Each business domain owns its own logic, while reusable code lives in shared directories.

Example:

```
app/
features/
shared/
api/
constants/
store/
utils/
design/
```

---

# Feature Ownership

Each feature should own everything related to its business domain.

Typical feature structure:

```
features/
└── developer/
    ├── api/
    ├── components/
    ├── hooks/
    ├── screens/
    ├── types/
    ├── validation/
    └── utils/
```

Avoid placing feature-specific code in global folders.

---

# Shared Code

Only place code in `shared/` if it is intended to be reused by multiple features.

Examples include:

- Shared UI components
- Shared hooks
- Shared utilities
- Shared types

Do not move code to `shared/` prematurely.

---

# Expo Router

The `app/` directory should contain routing only.

Responsibilities include:

- Route definitions
- Route groups
- Layouts
- Navigation

Business logic should remain inside the corresponding feature.

Screens inside `app/` should be thin wrappers.

---

# Backend Structure

The backend follows a module-based architecture.

Each module owns its:

- Routes
- Controller
- Service
- Repository
- Schema
- Types

Example:

```
modules/
└── developer/
    ├── controller.ts
    ├── service.ts
    ├── repository.ts
    ├── routes.ts
    ├── schema.ts
    └── types.ts
```

Modules should remain independent whenever possible.

---

# Global Directories

Use global directories only for application-wide concerns.

Examples:

- `api/` → Base HTTP client
- `store/` → Global client state
- `utils/` → Shared utilities
- `constants/` → Theme tokens and constants
- `design/` → Design documentation and standards

Avoid placing business logic in global directories.

---

# Structure Guidelines

- Keep related files together.
- Prefer feature encapsulation over global organization.
- Avoid duplicate folder structures.
- Remove obsolete files when they are no longer needed.
- Keep directory names consistent and descriptive.

---

# Goal

A developer should be able to locate any piece of functionality quickly by following a predictable and consistent project structure.