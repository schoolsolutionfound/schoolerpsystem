import React, { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import {
  multiFactor,
  TotpMultiFactorGenerator,
  type MultiFactorUser,
  type TotpSecret,
} from 'firebase/auth';

export const SettingsView: React.FC = () => {
  const [mfaUser, setMfaUser] = useState<MultiFactorUser | null>(null);
  const [mfaEnrolled, setMfaEnrolled] = useState(false);
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    if (auth.currentUser) {
      const mf = multiFactor(auth.currentUser);
      setMfaUser(mf);
      if (mounted) setMfaEnrolled(mf.enrolledFactors.length > 0);
    }
    return () => { mounted = false; };
  }, []);

  const startEnroll = async () => {
    if (!mfaUser) return;
    setBusy(true);
    setError('');
    setMsg('');
    try {
      const session = await mfaUser.getSession();
      const secret = await TotpMultiFactorGenerator.generateSecret(session);
      const accountName = auth.currentUser?.email || 'dev@schoolerp.com';
      setTotpSecret(secret);
      setQrUrl(secret.generateQrCodeUrl(accountName, 'SchoolERP'));
      setMsg('Scan the QR code in Google Authenticator (or enter the secret key), then enter the 6-digit code below.');
    } catch (err: any) {
      setError(err.message || 'Failed to start MFA enrollment.');
    } finally {
      setBusy(false);
    }
  };

  const confirmEnroll = async () => {
    if (!mfaUser || !totpSecret || verificationCode.length !== totpSecret.codeLength) return;
    setBusy(true);
    setError('');
    setMsg('');
    try {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(totpSecret, verificationCode);
      await mfaUser.enroll(assertion, 'TOTP');
      setMfaEnrolled(true);
      setTotpSecret(null);
      setQrUrl(null);
      setVerificationCode('');
      setMsg('Two-factor authentication is now enabled for this account.');
    } catch (err: any) {
      setError(err.message || 'Verification failed. Check the 6-digit code.');
    } finally {
      setBusy(false);
    }
  };

  const cancelEnroll = () => {
    setTotpSecret(null);
    setQrUrl(null);
    setVerificationCode('');
    setMsg('');
    setError('');
  };

  return (
    <div>
      <div className="header-bar">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">System configuration, API keys, and platform preferences</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Platform Configuration</h3>
        </div>
        <div className="settings-list">
          <div className="settings-item">
            <div>
              <div className="settings-item-label">Firebase Environment</div>
              <div className="settings-item-desc">Identity Provider</div>
            </div>
            <span className="badge badge-active">Connected</span>
          </div>

          <div className="settings-item">
            <div>
              <div className="settings-item-label">PostgreSQL Database</div>
              <div className="settings-item-desc">Primary ERP Business Store</div>
            </div>
            <span className="badge badge-active">Connected</span>
          </div>

          <div className="settings-item">
            <div>
              <div className="settings-item-label">Fastify API Gateway</div>
              <div className="settings-item-desc">Backend Microservice Layer</div>
            </div>
            <span className="badge badge-active">Active</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Security</h3>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)',
            color: 'var(--color-danger)', padding: '10px 14px', borderRadius: 'var(--radius-input)',
            fontSize: '13px', marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {msg && (
          <div style={{
            backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)',
            color: 'var(--color-success)', padding: '10px 14px', borderRadius: 'var(--radius-input)',
            fontSize: '13px', marginBottom: '16px',
          }}>
            {msg}
          </div>
        )}

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Two-Factor Authentication (TOTP)</div>
            <div className="settings-item-desc">
              {mfaEnrolled
                ? 'Enabled — an authenticator app code is required at sign-in.'
                : 'Disabled — add a second factor to secure this super-admin account.'}
            </div>
          </div>
          {mfaEnrolled ? (
            <span className="badge badge-active">Enabled</span>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={startEnroll} disabled={busy}>
              {busy ? 'Starting...' : 'Enable MFA'}
            </button>
          )}
        </div>

        {totpSecret && qrUrl && (
          <div style={{ marginTop: '16px', padding: '16px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>Step 1 — Add to your authenticator app</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
              In Google Authenticator (or similar), use the QR URL below or enter the secret key:
            </div>
            <div style={{
              padding: '12px', backgroundColor: 'var(--color-background)', borderRadius: '8px',
              fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all', marginBottom: '4px',
            }}>
              {qrUrl}
            </div>
            <div style={{
              padding: '12px', backgroundColor: 'var(--color-background)', borderRadius: '8px',
              fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all', marginBottom: '12px',
            }}>
              Secret: {totpSecret.secretKey}
            </div>
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>Step 2 — Verify the code</div>
            <input
              className="input"
              style={{ maxWidth: '220px', marginBottom: '10px' }}
              placeholder={`${totpSecret.codeLength}-digit code`}
              value={verificationCode}
              maxLength={totpSecret.codeLength}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-primary"
                onClick={confirmEnroll}
                disabled={busy || verificationCode.length !== totpSecret.codeLength}
              >
                {busy ? 'Verifying...' : 'Enable 2FA'}
              </button>
              <button className="btn btn-secondary" onClick={cancelEnroll} disabled={busy}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};