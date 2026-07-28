# Product Flow

## Purpose

This document describes the complete operational flow of the School ERP platform.

It explains how the platform is used from the moment a new institution is onboarded until teachers and students begin using the system.

This document represents the business workflow of the ERP and serves as the foundation for application design.

---

# Platform Overview

The platform consists of four primary actors:

Developer
    ↓
Institution Administrator
    ↓
Teacher
    ↓
Student

Each actor performs a specific responsibility before the next actor begins using the system.

---

# Phase 1 — Institution Onboarding

The Developer onboards a new institution into the ERP.

Flow

Developer
    ↓
Create Institution
    ↓
Configure Institution
    ↓
Configure Departments
    ↓
Configure Academic Years
    ↓
Configure Courses (if applicable)
    ↓
Assign Subscription
    ↓
Create Institution Administrator
    ↓
Institution Ready

At this stage, no teachers or students exist.

The institution is now ready for academic setup.

---

# Phase 2 — Institution Setup

The Institution Administrator logs into the ERP.

Their responsibility is to prepare the institution for academic operations.

Flow

Institution Administrator
    ↓
Review Institution Configuration
    ↓
Import Teachers
    ↓
Import Students
    ↓
Add Individual Users (Optional)
    ↓
Verify Imported Data
    ↓
Institution Ready For Daily Operations

---

# Phase 3 — Teacher Operations

Teachers perform daily academic activities.

Flow

Teacher Login
    ↓
View Assigned Classes
    ↓
Take Attendance
    ↓
Upload Marks
    ↓
Create Assignments
    ↓
View Student Information

Teachers only manage academic data related to their assigned responsibilities.

---

# Phase 4 — Student Experience

Students access their academic information.

First Login

Student Login
    ↓
Change Temporary Password
    ↓
Complete Profile
    ↓
Access Dashboard

Daily Usage

Student Login
    ↓
View Attendance
    ↓
View Marks
    ↓
View Assignments
    ↓
View Timetable
    ↓
Receive Notifications

Students cannot modify academic records.

---

# Data Creation Flow

Developer
    ↓
Institution

Institution
    ↓
Institution Administrator

Institution Administrator
    ↓
Teachers
    ↓
Students

Teachers
    ↓
Attendance
    ↓
Marks
    ↓
Assignments

Students
    ↓
View Academic Information

Every piece of academic data originates from an institution.

---

# Responsibility Flow

Developer
    ↓
Platform Management

Institution Administrator
    ↓
Institution Management

Teacher
    ↓
Academic Operations

Student
    ↓
Academic Consumption

Each role has a clearly defined responsibility.

Responsibilities should not overlap unless required by business rules.

---

# Guiding Principles

The Developer only manages institutions.

Institution Administrators manage institutional data.

Teachers perform academic work.

Students consume academic information.

Every workflow in the ERP should follow this responsibility hierarchy.

New modules should integrate into this flow rather than introducing alternative workflows.