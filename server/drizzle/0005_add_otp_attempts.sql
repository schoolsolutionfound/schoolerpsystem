-- OTP conversion: attempt counter for online brute-force protection.
ALTER TABLE "email_verification_tokens" ADD COLUMN IF NOT EXISTS "attempts" integer DEFAULT 0 NOT NULL;
