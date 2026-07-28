---
trigger: always_on
---

# Database Guidelines

## Purpose

Maintain a reliable, scalable, and consistent data layer that serves as the single source of truth for the application.

The database should enforce integrity, support future growth, and remain independent of business logic.

---

# Technology

The application uses:

- PostgreSQL
- Drizzle ORM
- Drizzle Kit

All database interactions should be performed through the repository layer.

---

# Schema Design

Design schemas that are:

- Strongly typed
- Normalized
- Consistent
- Easy to evolve

Use database constraints whenever appropriate instead of relying solely on application logic.

---

# Relationships

Define relationships explicitly using:

- Primary keys
- Foreign keys
- Unique constraints
- Composite keys where appropriate

Maintain referential integrity across related entities.

---

# Enums

Use database enums for values that represent fixed business concepts.

Examples include:

- User roles
- Institution types
- Status values

Avoid storing arbitrary strings for constrained domains.

---

# Migrations

All schema changes should be managed through version-controlled migrations.

Never modify production schemas manually.

Schema changes should remain reproducible across environments.

---

# Transactions

Use transactions whenever multiple database operations must succeed or fail together.

Avoid partial writes that may leave the database in an inconsistent state.

---

# Repository Ownership

Repositories are the only layer responsible for interacting with the database.

Services should never execute SQL or ORM queries directly.

---

# Single Source of Truth

PostgreSQL is the authoritative source of application data.

Avoid maintaining duplicate copies of persistent data in memory unless there is a well-defined caching strategy.

Caching should never replace the database as the source of truth.

---

# Goal

Maintain a robust, scalable, and consistent persistence layer that protects data integrity while remaining easy to evolve as the ERP grows.