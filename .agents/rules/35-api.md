---
trigger: always_on
---

# API Layer Standards

## Purpose

The API layer acts as the single communication gateway between the frontend and backend.

All network communication should pass through a centralized API client to ensure consistency, security, and maintainability.

---

# Centralized API Client

Every HTTP request must be performed through the project's shared API client.

Do not:

- Call `fetch()` directly.
- Create independent Axios instances.
- Perform HTTP requests inside screens or UI components.

The API client is the single source of truth for all network communication.

---

# Feature Ownership

Each feature should own its own API layer.

Example:

```
features/
    developer/
        api/
```

Feature APIs should contain business-specific requests, while the shared API client handles networking concerns.

---

# Responsibilities

The shared API client is responsible for:

- Base URL resolution
- Authentication headers
- Request configuration
- Error normalization
- Timeout configuration
- Environment handling

Business logic should never be placed inside the API client.

---

# Authentication

Authentication headers should be injected automatically by the API client.

Consumers should not manually attach authentication tokens unless explicitly required.

---

# Error Handling

All network errors should be converted into a consistent application error format.

Avoid exposing raw HTTP or library-specific errors to the UI.

Provide meaningful and user-friendly error messages whenever possible.

---

# Environment Support

The API client should support the project's development and production environments through centralized configuration.

Avoid hardcoding:

- Host addresses
- Ports
- Environment-specific URLs
- Authentication tokens

Environment-specific behavior should remain isolated inside the API layer.

---

# Anti-Patterns

Avoid:

- Calling APIs directly from components
- Duplicating API logic
- Creating multiple HTTP clients
- Manually attaching authentication headers in feature code
- Hardcoding backend URLs

---

# Goal

Maintain a single, reliable, and consistent networking layer that abstracts infrastructure concerns from feature implementations while providing a predictable interface for the rest of the application.