---
trigger: always_on
---

# Documentation

Before implementing any feature:

1. Read all project rules under `.agents/rules`.
2. Read the relevant documents under `docs/`.
3. Treat `docs/` as the business source of truth.
4. Implement only the active file under `specs/`.
5. If the specification conflicts with the documentation, ask for clarification instead of making assumptions.
6. Do not implement features outside the active specification.