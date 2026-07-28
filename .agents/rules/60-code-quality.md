---
trigger: always_on
---

# Code Quality & Maintainability Standards

## Purpose

Maintain a clean, readable, and maintainable codebase that is easy to understand, extend, and review.

Code quality should be treated as a long-term investment rather than a short-term optimization.

---

# Type Safety

Maintain strict TypeScript practices throughout the project.

- Avoid `any` unless absolutely unavoidable.
- Prefer explicit interfaces and types.
- Keep DTOs, API responses, component props, and function signatures strongly typed.
- Resolve type errors instead of suppressing them.

Maintain a healthy codebase with no known type errors.

---

# Validation

Validate data at every application boundary.

Frontend:

- Validate user input before submission.
- Keep validation schemas separate from UI components.

Backend:

- Validate all incoming requests before business logic executes.
- Reject invalid requests with meaningful error responses.

Avoid relying solely on frontend validation.

---

# Naming Conventions

Use descriptive and consistent names.

Examples:

- `useDeveloperQuery`
- `InstitutionService`
- `CreateInstitutionSchema`
- `AppButton`

Avoid:

- Generic names
- Abbreviations that reduce readability
- Single-letter variables outside small scopes

---

# Code Organization

Keep files focused on a single responsibility.

Prefer:

- Small functions
- Small components
- Clear separation of concerns

Extract reusable logic instead of duplicating it.

---

# Imports

Organize imports consistently.

Recommended order:

1. Framework libraries
2. Third-party packages
3. Internal shared modules
4. Feature modules
5. Types
6. Constants
7. Styles

Remove unused imports.

---

# Comments

Write code that is self-explanatory.

Use comments only when they provide meaningful context that cannot be expressed clearly through code.

Avoid redundant comments that simply restate the implementation.

---

# Error Handling

Handle errors explicitly.

Provide:

- Meaningful error messages
- Proper logging
- Consistent error responses

Avoid silent failures.

---

# Code Reviews

Before considering work complete, verify that:

- The implementation follows project architecture.
- Existing code has been reused where appropriate.
- Naming is consistent.
- Validation is present where required.
- Types are correct.
- Dead code has been removed.

---

# Anti-Patterns

Avoid:

- Large functions
- Deeply nested logic
- Duplicate code
- Dead code
- Commented-out code
- Magic strings and magic numbers
- Ignoring compiler warnings

---

# Goal

Produce code that is consistent, maintainable, and easy for future developers to understand while preserving the architectural standards of the project.