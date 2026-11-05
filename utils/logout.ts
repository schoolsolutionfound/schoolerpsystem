import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { logoutApi } from '../api/auth';
import { debugLog, debugWarn } from './debugLogger';

/**
 * Full logout: clears the local session immediately, then revokes the user's
 * refresh tokens server-side (POST /auth/logout → firebase-admin
 * revokeRefreshTokens) in the background. The user never waits on the network;
 * on the next launch the revoked token is rejected, so a stolen refresh token
 * is still dead everywhere.
 *
 * Never throws.
 */
export async function performLogout(): Promise<void> {
  debugLog('AUTH', 'logout started', { uid: auth.currentUser?.uid ?? null });

  let revokeFailed = false;
  const revocation = logoutApi().catch((err: any) => {
    revokeFailed = true;
    debugWarn('AUTH', 'server token revocation failed', { message: err?.message || String(err) });
    console.warn('[Logout] Server-side token revocation failed:', err?.message || err);
  });

  try {
    await signOut(auth);
    debugLog('AUTH', 'local signOut succeeded');
  } catch (err: any) {
    debugWarn('AUTH', 'local signOut failed', { message: err?.message || String(err) });
    console.warn('[Logout] Local signOut failed:', err?.message || err);
  } finally {
    // signOut resolves in a few ms; by then revocation is usually still in
    // flight. Give it a short grace period so tests and debug logs stay
    // deterministic, but never block the caller on a slow network.
    await Promise.race([
      revocation,
      new Promise<void>((resolve) => setTimeout(resolve, 3000)),
    ]);
  }
  if (!revokeFailed) debugLog('AUTH', 'server token revocation succeeded');
}
