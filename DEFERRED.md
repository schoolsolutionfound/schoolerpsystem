# Deferred work (explicit)

Approved deferrals for the P0 + Finance Wiring track (2026-09-23).

## Deferred — do not implement unless re-opened

| Item | Why deferred |
| --- | --- |
| Real payment gateway (UPI / net banking) | Out of scope; parent/student UI shows "pay at school accounts" — **full design ready in `PAYMENTS.md`** (Razorpay MVP plan, schema, webhook flow, phased roadmap) |
| SMS / WhatsApp fee reminders | No messaging backend approved |
| PDF receipt download | Client shows on-screen receipt only |
| Expense / payroll / fleet backend APIs | No expense tables or routes yet; expense UI remains local-store only |
| npm audit fixes / dependency bumps | Explicitly left alone |
| Secrets / `.env` / Firebase service-account JSON | Explicitly left alone |

## Mounted with local-only data

- Accountant **Income** tab (`IncomeManagementView`) — income comes from fee API via `useFinanceStore`.
- Accountant **Accounts** tab (`AccountsTallyView`) — income from API; expense side is empty until an expense backend exists.

## Not mounted (await expense backend)

- `ExpenseManagementView`
- `IncomeExpenseTallyView`
- `FleetTransportView`
