import { apiClient } from './client';

export async function syncLoginApi() {
  return apiClient('/auth/login-sync', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function changePasswordApi(newPassword: string, currentPassword?: string) {
  return apiClient('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ newPassword, currentPassword }),
  });
}

export async function logoutApi() {
  return apiClient('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

// ── Email verification (Phase 2) ────────────────────────────────────────────

export interface VerifyEmailStatus {
  verified: boolean;
  email: string;
}

export async function verifyEmailStatusApi(): Promise<VerifyEmailStatus> {
  return apiClient('/auth/verify-email/status', { method: 'GET' });
}

export async function verifyEmailOtpApi(code: string): Promise<{ verified: boolean; email: string }> {
  return apiClient('/auth/verify-email/verify', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export interface ResendVerificationEmail {
  sent: boolean;
  alreadyVerified?: boolean;
  // Present only when the server has no SES credentials (local/dev): the
  // freshly minted 6-digit code, so the flow can be completed without email.
  devCode?: string;
}

export async function resendVerificationEmailApi(): Promise<ResendVerificationEmail> {
  return apiClient('/auth/verify-email/resend', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
