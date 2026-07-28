---
trigger: always_on
---

# Core Principles & Standards

## 1. Purpose

These principles define the engineering standards that apply across the entire School ERP System. Every implementation should prioritize maintainability, scalability, consistency, and production readiness.

---

## 2. Primary Objectives

### Production-Ready Architecture

Build a scalable, multi-tenant ERP system that supports Developers, Maintainers, Teachers, and Students while remaining maintainable as the platform grows.

### Type Safety & Reliability

Maintain a healthy codebase with strict TypeScript practices. Avoid `any` in business logic, preserve type safety, and ensure the project remains free of build, type, and lint errors.

### Clean Architecture

Maintain clear separation of concerns between:

- Presentation Layer
- Client State
- Server State
- API Layer
- Business Logic
- Data Access Layer

Each layer should have a single, well-defined responsibility.

---

## 3. Engineering Standards

### 3.1 Never Assume

Never guess:

- Database schemas
- API contracts
- Folder structures
- Existing implementations
- File paths
- Component APIs

Inspect the project before making changes. Extend existing implementations whenever possible.

---

### 3.2 Preserve Existing Contracts

Maintain compatibility with existing:

- Function signatures
- API contracts
- Shared component interfaces
- Business rules
- Project conventions

Avoid introducing breaking changes unless explicitly requested.

---

### 3.3 Validate Your Work

Never claim a task is complete without validating the implementation.

Whenever possible, run the project's available validation tools, including:

- Type checking
- Linting
- Tests
- Build verification

If validation cannot be performed, state that clearly instead of assuming success.

---

### 3.4 Solve Root Causes

Fix the underlying cause of a problem rather than masking symptoms.

Avoid:

- Temporary hacks
- Silencing errors
- Ignoring warnings
- Dummy implementations
- Unnecessary workarounds

Every fix should improve the long-term health of the codebase.

---

### 3.5 Reuse Before Creating

Before adding new code, check whether an existing:

- Component
- Hook
- Utility
- Service
- Repository
- Type
- Helper

can be reused or extended.

Prefer extending existing functionality over creating duplicate implementations.

---

### 3.6 Maintain Consistency

Follow the project's established:

- Folder structure
- Naming conventions
- Architectural patterns
- Coding style
- Error handling
- File organization

Consistency is preferred over introducing alternative patterns.

---

## 4. Goal

The objective is not only to deliver working features, but to maintain a clean, scalable, and production-ready codebase that remains easy to understand, extend, and maintain over time.