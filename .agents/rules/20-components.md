---
trigger: always_on
---

# Shared Component Guidelines

## Purpose

Shared components provide a consistent user experience and reduce duplicated UI across the application.

Whenever multiple features require the same UI pattern, it should be extracted into a reusable shared component.

---

# Single Responsibility

Each shared component should have one clear responsibility.

Examples include:

- Buttons
- Inputs
- Cards
- Modals
- Badges
- Loading states
- Empty states
- Error states

Avoid creating components that solve multiple unrelated problems.

---

# Reusability

Before creating a new component:

1. Check whether a shared component already exists.
2. Extend an existing component if appropriate.
3. Create a new shared component only when multiple features can benefit from it.

Avoid duplicate UI implementations.

---

# Component API

Shared component APIs should be:

- Predictable
- Consistent
- Strongly typed
- Easy to understand

Prefer descriptive props over numerous boolean flags.

Example:

✅

variant="primary"

❌

isPrimary
isOutlined
isDanger
isPurple

---

# Styling

Shared components should never contain hardcoded design values.

Use the project's:

- Colors
- Typography
- Spacing
- Radius
- Shadows
- Animation tokens

All styling should come from the design system.

---

# Accessibility

Every shared component should support accessibility where appropriate.

Consider:

- accessibilityLabel
- accessibilityRole
- Focus states
- Disabled states
- Screen reader compatibility

Accessibility should be built into the component rather than added by consumers.

---

# Composition

Prefer composition over excessive configuration.

Allow consumers to customize behavior through children, props, and composition rather than creating large monolithic components.

---

# Consistency

Shared components should provide a consistent experience throughout the application.

Avoid creating multiple button, input, modal, or card implementations that behave differently.

---

# Goal

The shared component library should serve as the foundation for the application's UI, ensuring consistency, maintainability, and reusability across all features.