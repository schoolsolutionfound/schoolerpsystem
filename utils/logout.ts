import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { logoutApi } from '../api/auth';

/**
 * Full logout: revokes the user's refresh tokens server-side
 * (POST /auth/logout → firebase-admin revokeRefreshTokens) BEFORE
 * clearing the local session, so a stolen refresh token is dead
 * everywhere — not just on this device.
 *
 * Always completes the local sign-out even if revocation fails
 * (offline, server down) — never throws.
 */
export async function performLogout(): Promise<void> {
  try {
    await logoutApi();
  } catch (err: any) {
    console.warn('[Logout] Server-side token revocation failed:', err?.message || err);
  }

  try {
    await signOut(auth);
  } catch (err: any) {
    console.warn('[Logout] Local signOut failed:', err?.message || err);
  }
}
