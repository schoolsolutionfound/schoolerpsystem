---
trigger: always_on
---

# Frontend Development Guidelines

## Purpose

Define the frontend architecture and development standards for the School ERP mobile application.

The goal is to maintain a scalable, consistent, and maintainable codebase as new features and modules are introduced.

---

# Technology Stack

The frontend is built using:

- Expo
- React Native
- TypeScript
- Expo Router

Follow the project's existing stack unless explicitly instructed otherwise.

---

# Frontend Architecture

The frontend follows a **feature-first architecture**.

Business logic should remain inside feature modules.

A typical request flow is:

```
Screen
    ↓
Hook
    ↓
Feature API
    ↓
apiClient
    ↓
Backend API
```

Avoid bypassing this flow.

---

# Screen Responsibilities

Screens should primarily handle:

- Layout
- Navigation
- User interaction
- Calling hooks

Screens should **not** contain:

- API requests
- Complex business logic
- Data transformations
- Shared utility functions

Keep screens lightweight.

---

# Component Design

Components should:

- Have a single responsibility
- Be reusable where appropriate
- Receive data through props
- Avoid unnecessary internal state

Extract repeated UI into shared components.

---

# Forms

Use the project's standard form architecture.

Validation should remain separate from UI components.

Avoid embedding validation logic directly inside screens.

---

# Mobile Experience

Ensure the application behaves correctly across supported mobile platforms.

Consider:

- Keyboard handling
- Safe areas
- Different screen sizes
- Platform-specific behavior
- Loading states
- Empty states
- Error states

Build responsive interfaces instead of device-specific layouts.

---

# Performance

Prefer efficient rendering techniques.

Examples include:

- Virtualized lists for large datasets
- Memoization where beneficial
- Lazy loading when appropriate
- Avoiding unnecessary re-renders

Optimize only when it provides measurable value.

---

# Error Handling

Handle failures gracefully.

Provide:

- Loading indicators
- Empty states
- Error messages
- Retry actions when appropriate

Avoid silent failures.

---

# Accessibility

Build components that are accessible by default.

Consider:

- Readable touch targets
- Accessible labels
- Color contrast
- Keyboard accessibility where applicable

---

# Goal

The frontend should remain modular, predictable, and easy to extend while delivering a consistent user experience across all ERP modules.