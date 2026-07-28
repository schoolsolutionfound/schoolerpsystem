---
trigger: always_on
---

# State Management Guidelines

## Purpose

Maintain a clear separation between server state and client state to ensure predictable data flow, improved performance, and easier maintenance.

Each piece of state should have a single source of truth.

---

# Server State

Server state is data that originates from the backend and should be managed exclusively by **TanStack React Query**.

Examples include:

- Users
- Institutions
- Classes
- Subjects
- Attendance
- Grades
- Notifications
- Any other backend-managed resources

Use React Query for:

- Data fetching
- Caching
- Background refetching
- Mutations
- Cache invalidation

Do not duplicate server data in local state.

---

# Query Organization

Organize queries by feature.

Each feature should own:

- Query hooks
- Mutation hooks
- Query keys
- API interactions

Keep query keys centralized within their respective feature to maintain consistency and simplify cache management.

---

# Cache Management

Every successful mutation should update the application state through React Query.

Prefer:

- Cache invalidation
- Optimistic updates (when appropriate)
- Cache updates

Avoid manually synchronizing duplicated state.

---

# Client State

Client state represents UI or application state that exists only on the device.

Examples include:

- Current user session
- Theme preference
- Drawer visibility
- Selected tab
- Filters
- Form drafts
- Local preferences

Manage client state using **Zustand**.

---

# Persistence

Persist only data that should survive application restarts.

Examples include:

- Authentication session
- User preferences
- Theme settings

Avoid persisting temporary UI state unless there is a clear user benefit.

---

# State Ownership

Each piece of state should have one owner.

React Query owns:

- Backend data
- Remote resources
- Cached API responses

Zustand owns:

- Local application state
- UI state
- Device-specific preferences

Avoid storing the same information in both systems.

---

# Anti-Patterns

Avoid:

- Copying API responses into Zustand
- Duplicating server entities in local state
- Manually synchronizing server and client state
- Fetching backend data outside React Query without justification

---

# Goal

Maintain a predictable state architecture where server data is managed by React Query, local application state is managed by Zustand, and every piece of state has a single source of truth.