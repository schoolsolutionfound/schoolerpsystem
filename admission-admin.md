# Admission Module: Administrator Integration Guide & Rules

## 1. Purpose of this Document
This guide defines the explicit rules, API contracts, and data structures that the **Admin Panel Developer / Institution Administrator** must follow to feed configuration data into the **Admission Cell** module.

The Admission Officer interface is dynamic and built to automatically adapt to whatever the Admin configures.

---

## 2. Core Admin Responsibilities

The Administrator must supply the Admission Cell with two main configuration elements:
1. **Seat Matrix & Quotas** (Branches/Programs, seat caps, and quota partitions)
2. **Dynamic Form Fields** (Custom fields segregated by `programType`: School, PU, Engineering, Degree)

---

## 3. Quota & Seat Matrix Partitioning Rules

### Rule 1: Sub-Quotas Are Carved Out of the Course Total
- If Computer Science (`CS`) has **120 seats**, the quota seats (e.g. CET, Management, COMEDK, Sports) are **subsets** of those 120 seats.
- They are **not** in addition to the 120 seats.

$$\sum \text{quota.seats} \le \text{totalSeats}$$

### Rule 2: Unallocated Quotas Default to General
- If `totalSeats` is 120, CET has 80, and Management has 30, the remaining 10 seats automatically reside in the `"General"` pool.

### Payload Schema for Adding/Configuring a Course:
```json
{
  "academicYear": "2026-2027",
  "courseCode": "CS",
  "courseName": "Computer Science & Engineering",
  "programType": "engineering",
  "totalSeats": 120,
  "quotas": [
    {
      "quotaName": "CET",
      "seats": 80
    },
    {
      "quotaName": "Management",
      "seats": 40
    }
  ]
}
```

---

## 4. Program Types & Dynamic Form Fields Segregation

The Administrator can configure custom fields per `programType`.

### Supported Program Types:
| `programType` | Target Institution Level | Example Specific Fields |
|---|---|---|
| `school` | K-10 Schools | Previous School Name, Birth Certificate No, Second Language Preference |
| `pu` | Pre-University / +2 Colleges | 10th Board (State/CBSE/ICSE), 10th Percentage, Stream Combination (`PCMB`, `PCMC`, `COMMERCE`) |
| `engineering` | Engineering Colleges | KCET Rank, COMEDK Rank, Diploma Registration No, 12th PCM Percentage |
| `degree` | Undergraduate / Postgraduate Colleges | 12th Stream, Major Preference, Qualifying Exam Roll No |
| `all` | Shared across all types | Transportation requirement, Hostel preference |

### Field Configuration Schema (`admission_form_configs`):
When the Admin registers custom fields via the API (`POST /api/v1/admission/form-config`), use the following schema:

```json
{
  "programType": "engineering",
  "fieldKey": "kcetRank",
  "label": "KCET Rank / Score",
  "fieldType": "number",
  "isRequired": false,
  "placeholder": "e.g. 4500",
  "order": 1,
  "isActive": true
}
```

For dropdown / select fields:
```json
{
  "programType": "pu",
  "fieldKey": "streamCombination",
  "label": "Subject Combination",
  "fieldType": "select",
  "options": ["PCMB", "PCMC", "Commerce with Maths", "Arts"],
  "isRequired": true,
  "order": 2,
  "isActive": true
}
```

### Supported Field Types:
- `"text"`: Single-line input
- `"number"`: Numeric value (ranks, percentages, registration numbers)
- `"select"`: Single-choice dropdown (options provided in `options` array)
- `"date"`: Date picker
- `"boolean"`: Switch / Checkbox
- `"textarea"`: Multi-line text

---

## 5. What the Admission Officer Module Handles Automatically

1. **Default Core Fields**:
   The Admission Officer form *always* includes the baseline student details:
   - Full Name
   - Parent Phone Number
   - Date of Birth
   - Father's Name
   - Mother's Name
   - Guardian Phone Number
   - Residential Address
   - Blood Group
   - Preferred Branch

2. **Automatic Dynamic Injection**:
   - The Admission Officer UI queries `GET /api/v1/admission/form-config`.
   - Any fields the Admin has configured for the institution's type will render dynamically.
   - When submitted, values are automatically saved into `admission_applications.customFields` without requiring backend schema migrations.

3. **Waiting List Allocation**:
   - When the Admission Officer allocates a student to a branch and quota, the system performs real-time capacity checks.
   - Over-allocation beyond the quota limit is blocked.
   - Unallocating a candidate immediately restores the quota seat.

---

## 6. Admin API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/admission/courses` | List all courses and seat matrix |
| `POST` | `/api/v1/admission/courses` | Create/update course seats & quota distributions |
| `GET` | `/api/v1/admission/form-config` | Fetch active dynamic fields |
| `POST` | `/api/v1/admission/form-config` | Create/update a dynamic custom field |
| `DELETE` | `/api/v1/admission/form-config/:id` | Deactivate/remove a custom field |
