import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  getMultiFactorResolver,
  TotpMultiFactorGenerator,
  auth,
  type MultiFactorResolver,
  type MultiFactorError,
} from '../services/firebase';

interface LoginViewProps {
  onLoginSuccess: (email: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (email && password) {
        await signInWithEmailAndPassword(auth, email, password);
        onLoginSuccess(email);
      } else {
        setError('Please enter email and password.');
      }
    } catch (err: any) {
      if (err?.code === 'auth/multi-factor-auth-required') {
        const resolver = getMultiFactorResolver(auth, err as MultiFactorError);
        setMfaResolver(resolver);
        setMfaCode('');
        setError('');
      } else {
        setError(err.message || 'Authentication failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaResolver) return;
    setError('');
    setLoading(true);

    try {
      const enrollmentId = mfaResolver.hints[0]?.uid || '';
      const assertion = TotpMultiFactorGenerator.assertionForSignIn(enrollmentId, mfaCode);
      await mfaResolver.resolveSignIn(assertion);
      onLoginSuccess(email);
    } catch (err: any) {
      if (err?.code === 'auth/invalid-multi-factor-session' || err?.code === 'auth/missing-multi-factor-session') {
        setMfaResolver(null);
        setError('Two-factor session expired. Please sign in again.');
      } else {
        setError(err.message || 'Invalid code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px', backgroundColor: 'var(--color-background)' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '6px',
            background: 'linear-gradient(135deg, var(--color-primary), #F4C430)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '18px', fontWeight: 700, color: '#fff',
            boxShadow: '0 4px 12px rgba(126, 87, 194, 0.35)',
          }}>S</div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            Developer Console
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)' }}>
            SchoolERP Platform Administration
          </p>
        </div>

        <div style={{
          backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        }}>
          {error && (
            <div style={{
              backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)',
              color: 'var(--color-danger)', padding: '10px 14px', borderRadius: 'var(--radius-input)',
              fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span>!</span>
              <span>{error}</span>
            </div>
          )}

          {mfaResolver ? (
            <form onSubmit={handleMfaSubmit}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Two-factor authentication
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                Signing in as <strong>{email}</strong>. Enter the 6-digit code from your authenticator app.
              </p>

              <div className="form-group">
                <label className="form-label">Authenticator code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input"
                  placeholder="123456"
                  value={mfaCode}
                  maxLength={6}
                  autoFocus
                  required
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '42px', fontSize: '14px' }} disabled={loading || mfaCode.length !== 6}>
                  {loading ? 'Verifying...' : 'Verify and sign in'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%', height: '36px', fontSize: '13px' }}
                  disabled={loading}
                  onClick={() => { setMfaResolver(null); setMfaCode(''); setError(''); }}
                >
                  Use a different account
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '42px', marginTop: '8px', fontSize: '14px' }} disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign in'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
