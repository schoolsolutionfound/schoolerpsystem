-- Email verification (Phase 2 — custom provider + AWS SES).
-- Purely additive: new columns on users + three new tables.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "email_verified" boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp;

CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
  "id" text PRIMARY KEY,
  "institution_code" varchar(100) NOT NULL,
  "email" varchar(255) NOT NULL,
  "firebase_uid" text DEFAULT '',
  "token_hash" text NOT NULL,
  "sent_at" timestamp DEFAULT now(),
  "expires_at" timestamp NOT NULL,
  "consumed_at" timestamp,
  "created_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_evt_token_hash"
  ON "email_verification_tokens" ("token_hash");
CREATE INDEX IF NOT EXISTS "idx_evt_email_sent"
  ON "email_verification_tokens" ("email", "sent_at");
CREATE INDEX IF NOT EXISTS "idx_evt_expires"
  ON "email_verification_tokens" ("expires_at");

CREATE TABLE IF NOT EXISTS "email_suppressions" (
  "id" text PRIMARY KEY,
  "institution_code" varchar(100) NOT NULL,
  "email" varchar(255) NOT NULL,
  "reason" varchar(20) DEFAULT 'bounce' NOT NULL,
  "ses_event_id" varchar(128) DEFAULT '',
  "detail" text DEFAULT '',
  "created_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_sup_email_inst"
  ON "email_suppressions" ("institution_code", "email");
CREATE INDEX IF NOT EXISTS "idx_sup_email"
  ON "email_suppressions" ("email");

CREATE TABLE IF NOT EXISTS "institution_email_config" (
  "institution_code" varchar(100) PRIMARY KEY,
  "from_email" varchar(255) NOT NULL,
  "from_name" varchar(200) DEFAULT '' NOT NULL,
  "reply_to" varchar(255) DEFAULT '',
  "configuration_set" varchar(128) DEFAULT '',
  "domain" varchar(255) DEFAULT '',
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
