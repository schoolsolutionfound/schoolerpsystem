# Admission Cell Feature Architecture & Specification

## 1. Overview
The **Admission Cell** module is a dedicated subsystem within the School ERP platform that empowers the **Admission Officer** to manage student onboarding, prospective student registries, dynamic admission forms, and real-time seat matrix tracking with quota partitions (e.g., CET, Management, COMEDK, General).

---

## 2. Core Personas & Access Control

| Role | Access Level | Description |
|---|---|---|
| **Platform / Institution Admin** | Super Admin | Creates the Admission Officer account using the existing Admin user creation flow. Defines branches/courses, batches, seat limits, and dynamic custom fields. |
| **Admission Officer (`admission_officer`)** | Officer / Manager | Registers prospective students via the `+` Dynamic Form, oversees Waiting Lists, allocates branch and quota seats, unallocates seats, confirms admissions, and monitors seat metrics. |

---

## 3. Student Lifecycle & State Machine

Every prospective student moves through a strict 3-stage lifecycle:

```
                  ┌──────────────────────┐
                  │   (+) Register via   │
                  │ Dynamic Intake Form  │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │     WAITING LIST     │  <-- No seat consumed
                  │ (Filter by Batch,    │
                  │  Branch Pref, Phone) │
                  └──────────┬───────────┘
                             │
            [Officer Allocates Branch & Quota]
            (e.g., CS Branch - CET Quota)
                             │
                             ▼
                  ┌──────────────────────┐
       ┌───────── │      ALLOCATED       │ <───┐
       │          │ (Seat held/reserved; │     │
       │          │  Can be unallocated) │     │
       │          └──────────┬───────────┘     │
       │                     │                 │
[Officer Unallocates]        │          [Seat Cancelled/
(Seat returned to pool)      │           Withdrawn]
       │            [Officer Confirms]         │
       │            (Fee verified / paid)      │
       │                     │                 │
       ▼                     ▼                 │
[Reverts to Waiting List] ┌──────────────────────┐
                          │      CONFIRMED       │ ────┘
                          │ (Seat locked;        │
                          │  Ready for ERP Sync) │
                          └──────────────────────┘
```

### State Definitions:
1. **`waiting_list`**: Default state upon intake. Candidate details are securely stored. **Zero seats are consumed**.
2. **`allocated`**: The student is provisionally allotted a seat in a specific branch (e.g., CS) under a specific quota (e.g., CET).
   - Seat arithmetic: Branch allocated count increments; available count decrements.
   - Reversibility: The officer can click **"Unallocate Seat"** at any time. The seat is instantly restored to the branch/quota pool and the student returns to the Waiting List.
3. **`confirmed`**: The admission is finalized (e.g., after fee clearance, document verification). The seat is permanently locked and non-transferable.
4. **`cancelled`**: Application withdrawn or discarded.

---

## 4. Seat Matrix & Quota Engine

Courses have a total capacity, and that capacity is partitioned into quotas:

$$\text{Total Course Seats} \ge \sum \text{Quota Seats}$$

### Example:
- **Course**: Computer Science & Engineering (`CS`)
- **Total Capacity**: 120 seats
- **Quota Distribution**:
  - `CET Quota`: 80 seats
  - `Management Quota`: 40 seats
  - *(Total: $80 + 40 = 120$ seats)*

### Real-Time Seat Metrics:
- **Total Seats**: Sum of capacities across all registered courses for the active batch.
- **Allocated Seats**: Count of students currently in `allocated` state.
- **Confirmed Seats**: Count of students currently in `confirmed` state.
- **Available Seats**: $\text{Total Seats} - (\text{Allocated Seats} + \text{Confirmed Seats})$.
- **Waiting List**: Total prospective candidates waiting for allocation.

---

## 5. Dynamic Form Pipeline Architecture

To prevent hardcoded form constraints, the Admission Form uses a **metadata-driven dynamic pipeline**:
1. **Default Core Fields** (Rendered by default):
   - Full Name
   - Parent Phone Number
   - Date of Birth
   - Father's Name
   - Mother's Name
   - Guardian Phone Number
   - Residential Address
   - Blood Group
   - Preferred Course / Branch
2. **Dynamic Custom Fields Pipeline**:
   - Stored in `admission_form_configs` per `programType` (`school`, `pu`, `engineering`, `degree`).
   - Dynamically rendered on the frontend.
   - Values saved into `admission_applications.customFields` (JSONB) without modifying the database schema.

---

## 6. Directory Layout

```
schoolerpsystem/
├── app/(admission)/                 # Next-gen Expo Router screens
│   ├── _layout.tsx
│   └── home.tsx                     # Main Kivquo Bottom Tabs & Floating Action (+)
├── features/admission/
│   └── components/
│       ├── AdmissionHomeHeader.tsx          # Top greeting & institution header
│       ├── AdmissionDrawer.tsx              # Sliding navigation drawer
│       ├── AdmissionSeatTrackingView.tsx    # Real-time metrics & course seat bars
│       ├── AdmissionStudentsView.tsx        # Filterable segmented list (Waiting, Allocated, Confirmed)
│       ├── AdmissionStudentDetailModal.tsx  # Clean detail modal (Zero icon clutter)
│       ├── AdmissionStudentFormModal.tsx    # Dynamic intake form
│       ├── AdmissionAllocationModal.tsx     # Allocation & Quota assignment modal
│       ├── AdmissionBatchConfigModal.tsx    # Manage courses & quota partition
│       └── AdmissionProfileView.tsx         # Officer profile
├── api/
│   └── admission.ts                         # Client-side API queries & mutations
└── server/src/modules/admission/
    ├── admission.routes.ts                  # Fastify v1 endpoints
    ├── admission.controller.ts              # Route controller
    ├── admission.service.ts                 # Allocation arithmetic & business logic
    ├── admission.schema.ts                  # Zod validation schemas
    └── admission.middleware.ts              # Role guard (admission_officer + admin)
```

---

## 7. Future Requirements Roadmap
When extending the Admission module, append new feature specifications here:
- **Batch Export**: Export waiting list and confirmed candidates to Excel / CSV.
- **Automated SMS / WhatsApp alerts**: Notify parents when a seat is provisionally allocated.
- **ERP Student Provisioning**: One-click convert confirmed student into permanent ERP student with Roll No / USN generation.
