---
trigger: always_on
---

# Backend Development Standards

## Purpose

Maintain a modular, scalable, and maintainable backend by enforcing clear separation of responsibilities between routing, request handling, business logic, and data access.

---

# Architecture

The backend follows a layered architecture:

```
Route
    ↓
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

Each layer has a single responsibility and should remain independent from the others.

---

# Routes

Routes are responsible for:

- Defining endpoints
- Registering middleware
- Mapping requests to controllers

Routes should not contain business logic or database operations.

---

# Controllers

Controllers should remain thin.

Responsibilities include:

- Receiving requests
- Parsing inputs
- Triggering validation
- Calling services
- Returning HTTP responses

Controllers should not:

- Access the database
- Implement business rules
- Contain complex logic

---

# Services

Services contain the application's business logic.

Responsibilities include:

- Business validation
- Permission checks
- Workflow orchestration
- Calling repositories
- Coordinating multiple operations

Services should remain independent of HTTP concerns whenever possible.

---

# Repositories

Repositories are responsible only for data access.

Responsibilities include:

- Database queries
- CRUD operations
- Transactions
- Mapping persistence models

Repositories should not contain business logic.

---

# Middleware

Middleware should handle cross-cutting concerns such as:

- Authentication
- Authorization
- Request validation
- Logging
- Rate limiting

Business logic should not be implemented inside middleware.

---

# Validation

Validate incoming requests before business logic executes.

Prefer centralized validation rather than scattered manual checks throughout the application.

---

# Error Handling

Handle errors consistently across the backend.

Avoid exposing internal implementation details or raw database errors to clients.

Return meaningful HTTP responses while keeping internal errors logged for debugging.

---

# Dependency Flow

Dependencies should always flow downward:

```
Route
    ↓
Controller
    ↓
Service
    ↓
Repository
```

Lower layers should never depend on higher layers.

---

# Anti-Patterns

Avoid:

- Database queries inside controllers
- Business logic inside routes
- Business logic inside repositories
- Circular dependencies between modules
- Sharing mutable state across requests

---

# Goal

Maintain a backend architecture that is modular, testable, scalable, and easy to extend while keeping responsibilities clearly separated across all layers.