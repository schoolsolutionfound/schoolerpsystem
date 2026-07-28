You are working on a School/College ERP SaaS application.

Before making any code changes, understand the complete business flow.

## Product Overview

This ERP is a SaaS platform where one application serves multiple colleges and schools.

There are four main actors:

1. Developer (Super Admin)
2. Maintainer
3. Teacher
4. Student

Parents and other roles will be added later.

---------------------------------------------------

## Developer

Developer owns the entire ERP.

Developer can:

- Create Colleges/Schools
- Edit Colleges
- Delete Colleges
- Enable or Disable subscription
- Create Maintainer accounts
- View all colleges
- View student count
- View teacher count

Developer never belongs to any college.

---------------------------------------------------

## College

Each college has:

- id
- collegeCode (Unique)
- collegeName
- institutionType (School / College)
- subscriptionStatus
- createdAt
- updatedAt

Example

PACE College

collegeCode = PACECLGENG01

ABC School

collegeCode = ABCSCHOOL01

Every student and teacher belongs to exactly one college.

---------------------------------------------------

## Teacher

Teacher logs in using Firebase Authentication.

Teachers have:

role = teacher

Some teachers are also Maintainers.

Maintainer is NOT a role.

Maintainer is simply

isMaintainer = true

Normal teachers

isMaintainer = false

---------------------------------------------------

## Maintainer

Maintainer manages onboarding inside one college.

Maintainer CANNOT

- create colleges
- delete colleges
- manage subscriptions

Maintainer CAN

- Feed Student data
- Feed Teacher data
- Edit student information
- View teachers
- View students

---------------------------------------------------

## Student

Students DO NOT register themselves.

Maintainer creates student accounts using Excel upload.

Each Excel row contains:

- First Name
- Last Name
- Email
- Temporary Password
- Roll Number / USN
- Department
- Semester
- Section
- College Code

System creates Firebase Authentication accounts.

Student profile is created automatically.

Student is permanently mapped to the college using College Code.

Email is only used for login.

College ownership is determined by the mapped collegeCode.

Example

raees@gmail.com

belongs to

PACECLGENG01

This mapping is permanent unless changed by Developer.

---------------------------------------------------

## Login Flow

No role selection screen.

Separate login screens exist.

Student Login

Teacher Login

Developer Login

After login

Backend verifies Firebase Token.

Then determines user type.

Then redirects automatically.

---------------------------------------------------

## Student First Login

Student Login

↓

Temporary Password

↓

Force Change Password

↓

Verify Email

↓

Complete Profile

↓

Dashboard

Students cannot access dashboard until onboarding is complete.

---------------------------------------------------

## Complete Profile

Mandatory fields

DOB

Gender

Phone

Parent Phone

Profile Picture

If Institution Type = College

also ask

10th Percentage

12th Percentage / Diploma Percentage

Department

Semester

Section

come from Excel feed.

Students cannot edit these.

---------------------------------------------------

## Teacher First Login

Teacher

↓

Login

↓

Change Password

↓

Complete Profile

↓

Dashboard

---------------------------------------------------

## Subscription

Developer can disable subscription.

If disabled

Teachers and Students cannot use ERP.

Only Developer can still login.

---------------------------------------------------

## Architecture Rules

Use clean architecture.

Routes

↓

Controllers

↓

Services

↓

Repositories

↓

Database

Controllers should remain thin.

Business logic belongs inside services.

Repositories handle database.

Never put database logic inside controllers.

---------------------------------------------------

Do not invent new business logic.

If unsure, ask before implementing.

Follow this architecture throughout the project.