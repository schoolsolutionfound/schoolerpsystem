---
trigger: always_on
---

# Design System & Theming Guidelines

## Purpose

Maintain a consistent visual language across the entire application by using the project's design system as the single source of truth.

Every UI element should follow the established design tokens, component standards, and theming conventions.

---

# Design System First

Before creating or modifying UI:

- Review the existing design system.
- Reuse existing design tokens.
- Extend the design system when necessary instead of introducing new visual patterns.

Do not create parallel styling systems.

---

# Theme Tokens

Never hardcode design values.

Always use the project's theme tokens for:

- Colors
- Typography
- Spacing
- Border radius
- Shadows
- Elevation
- Opacity
- Animation durations

If a required token does not exist, extend the theme rather than hardcoding a value.

---

# Component Consistency

UI components should maintain a consistent appearance throughout the application.

Ensure consistency in:

- Border radius
- Spacing
- Typography
- Elevation
- Interactive states
- Icon sizing
- Button styles
- Input styles

Users should experience the same visual language across every screen.

---

# Reusable Components

Before creating a custom UI element:

1. Check whether a shared component already exists.
2. Extend the shared component if appropriate.
3. Create a new reusable component only when necessary.

Avoid duplicating UI patterns.

---

# Responsive Design

Design layouts that adapt gracefully across different:

- Screen sizes
- Orientations
- Device types
- Platforms

Avoid fixed dimensions when flexible layouts are more appropriate.

---

# Accessibility

Design should remain accessible by default.

Consider:

- Touch target size
- Color contrast
- Readable typography
- Focus states
- Disabled states
- Error states

Accessibility should never be treated as an afterthought.

---

# Visual Quality

Maintain a clean and modern interface.

Prefer:

- Consistent spacing
- Balanced layouts
- Subtle elevation
- Clear visual hierarchy
- Meaningful animations

Avoid excessive decoration or inconsistent styling.

---

# Goal

The design system should provide a unified visual identity that makes every module feel like part of the same application while remaining easy to evolve over time.