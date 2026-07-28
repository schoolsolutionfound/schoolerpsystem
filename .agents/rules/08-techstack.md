---
trigger: always_on
---

# Technology Stack

## Purpose

This document defines the approved technologies for the project.

These technologies are project standards and should be used consistently across all implementations.

Do not introduce alternative technologies unless explicitly requested.

---

# Mobile

Framework

- Expo SDK 54
- React Native 0.81
- React 19

Language

- TypeScript

Routing

- Expo Router

---

# Backend

Framework

- Node.js
- Fastify

---

# Database

Primary Database

- PostgreSQL (Cloud SQL in production)

PostgreSQL is the primary source of truth for all ERP business data.

Examples include:

- Users
- Institutions
- Institution Admins
- Teachers
- Students
- Departments
- Subjects
- Attendance
- Timetables
- Fees
- Marks
- Permissions
- Scope

All business data should be accessed through Drizzle ORM.

---

# ORM

- Drizzle ORM
- Drizzle Kit (Schema & Migrations)

---

# Authentication

Firebase Authentication is the project's identity provider.

Use Firebase Auth only for:

- User authentication
- Identity (Firebase UID)
- Email verification
- Password reset
- Authentication tokens

Do not store ERP business entities in Firebase Authentication.

---

# Realtime

Firestore is used only for realtime capabilities.

Examples:

- Chat
- Presence
- Live announcements
- Live event synchronization
- Notification metadata

Firestore is **not** the primary business database.

---

# Cache

Redis (Upstash)

Use Redis for:

- Frequently accessed data
- Session cache
- Performance optimization

Never use Redis as permanent storage.

---

# File Storage

Google Cloud Storage

Use for:

- Photos
- Documents
- Attachments
- Report cards

---

# Notifications

Push notifications use:

- Firebase Cloud Messaging (FCM)
- Expo Notifications

---

# State Management

Client State

- Zustand

Server State

- TanStack React Query

---

# Error Monitoring

- Sentry

---

# Deployment

Backend

- Google Cloud Run

Admin Panel

- Firebase Hosting

Database

- Google Cloud SQL (PostgreSQL)

---

# Technology Standards

These technologies are project standards.

Do not replace them or introduce alternative technologies unless explicitly requested.

Examples:

- Do not replace Fastify.
- Do not replace PostgreSQL.
- Do not replace Drizzle ORM.
- Do not replace Firebase Authentication.
- Do not introduce Prisma, MongoDB, Supabase Auth, Socket.IO, or other alternatives unless the task explicitly requires them.

When implementing features, always use the technologies defined in this document.