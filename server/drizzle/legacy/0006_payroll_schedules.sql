-- 0006: Recurring payroll schedules + payroll columns on expense_records
-- Recurring salary periods are generated server-side (sweep + login catch-up)
-- as PENDING expense rows linked to a schedule; payments allocate oldest-first.

CREATE TABLE IF NOT EXISTS payroll_schedules (
  id text PRIMARY KEY,
  institution_code varchar(100) NOT NULL,
  user_id varchar(128) NOT NULL,
  payee_name varchar(255) NOT NULL,
  role varchar(50) NOT NULL DEFAULT '',
  department varchar(100),
  amount numeric(12, 2) NOT NULL,
  frequency varchar(20) NOT NULL,
  day_of_month integer,
  days_of_month jsonb NOT NULL DEFAULT '[]'::jsonb,
  weekday integer,
  start_date date NOT NULL,
  active boolean NOT NULL DEFAULT true,
  notes text,
  last_generated_key varchar(32),
  created_by text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payroll_schedules_inst ON payroll_schedules (institution_code);
CREATE INDEX IF NOT EXISTS idx_payroll_schedules_user ON payroll_schedules (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payroll_schedules_active_user
  ON payroll_schedules (institution_code, user_id) WHERE active;

ALTER TABLE expense_records ADD COLUMN IF NOT EXISTS schedule_id varchar(64);
ALTER TABLE expense_records ADD COLUMN IF NOT EXISTS user_id varchar(128);
ALTER TABLE expense_records ADD COLUMN IF NOT EXISTS period_key varchar(64);
ALTER TABLE expense_records ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE expense_records ADD COLUMN IF NOT EXISTS paid_amount numeric(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE expense_records ADD COLUMN IF NOT EXISTS payroll_type varchar(20);

-- Backfill: legacy paid rows are fully settled (partial payments are new).
UPDATE expense_records SET paid_amount = amount WHERE status = 'paid' AND paid_amount = 0;

CREATE UNIQUE INDEX IF NOT EXISTS uq_expense_period_key
  ON expense_records (schedule_id, period_key)
  WHERE schedule_id IS NOT NULL AND period_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expense_records_schedule
  ON expense_records (schedule_id) WHERE schedule_id IS NOT NULL;
