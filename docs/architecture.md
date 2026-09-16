# Architecture

## Purpose

This document defines the overall architecture of the School ERP platform.

It explains how the different applications interact while sharing the same backend and data.

---

# Platform Architecture

The School ERP consists of multiple client applications connected to a single backend.

Applications

- Developer Console (Web)
- Mobile Application

All applications communicate with the same backend services.

---

# Developer Console

The Developer Console is a separate web application.

Purpose

- Create Institutions
- Configure Institutions
- Create Institution Administrators
- Manage Subscription Plans
- Monitor Platform

The Developer Console is intended only for platform developers.

It is not part of the mobile application.

The Developer role will not be available inside the mobile app.

---

# Mobile Application

The mobile application is used by:

- Institution Administrators
- Teachers
- Students

Each user is routed to their respective dashboard after authentication.

The mobile application does not contain Developer functionality.

---

# Shared Backend

Both applications communicate with the same backend.

Backend Responsibilities

- Authentication
- User Management
- Institution Management
- Student Management
- Teacher Management
- Attendance
- Academic Data
- Notifications

Business logic must remain inside the backend and should not be duplicated across clients.

---

# Shared Database

The platform uses a single backend and shared databases.

Firebase Authentication

Responsible for:

- Identity
- Login
- Password Management

PostgreSQL

Responsible for:

- Institutions
- Users
- Students
- Teachers
- Attendance
- Academic Data
- Business Rules

Redis

Responsible for:

- Caching
- Performance Improvements

Future services may be introduced without changing the client applications.

---

# Authentication

Authentication UI for the mobile application is already implemented.

The remaining work is to connect the existing interface with backend APIs and application data.

The authentication experience should be driven by backend responses rather than local mock data.

---

# Routing

Developer

Developer Console (Web)

Institution Administrator

Mobile Application

Teacher

Mobile Application

Student

Mobile Application

Each application should only contain functionality relevant to its intended users.

---

# Guiding Principles

Separate clients.

Shared backend.

Shared business logic.

Single source of truth.

Business rules belong in the backend.

Clients are responsible only for presenting data and interacting with backend services.