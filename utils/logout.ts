import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { logoutApi } from '../api/auth';
import { debugLog, debugWarn } from './debugLogger';

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
  debugLog('AUTH', 'logout started', { uid: auth.currentUser?.uid ?? null });
  try {
    await logoutApi();
    debugLog('AUTH', 'server token revocation succeeded');
  } catch (err: any) {
    debugWarn('AUTH', 'server token revocation failed', { message: err?.message || String(err) });
    console.warn('[Logout] Server-side token revocation failed:', err?.message || err);
  }

  try {
    await signOut(auth);
    debugLog('AUTH', 'local signOut succeeded');
  } catch (err: any) {
    debugWarn('AUTH', 'local signOut failed', { message: err?.message || String(err) });
    console.warn('[Logout] Local signOut failed:', err?.message || err);
  }
}
