import React, { useEffect, useState } from 'react';
import { developerApi } from '../services/api';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    developerApi
      .getStats()
      .then((data) => setStats(data))
      .catch((err) => console.warn('[Stats Fetch Error]', err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="header-bar">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Platform overview and institution onboarding</p>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ fontWeight: 700, fontSize: '16px' }}>I</div>
          <div className="stat-content">
            <div className="stat-value">{loading ? '—' : stats?.totalInstitutions ?? 0}</div>
            <div className="stat-label">Total Institutions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', fontWeight: 700, fontSize: '16px' }}>A</div>
          <div className="stat-content">
            <div className="stat-value">{loading ? '—' : stats?.activeInstitutions ?? 0}</div>
            <div className="stat-label">Active Institutions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)', fontWeight: 700, fontSize: '16px' }}>U</div>
          <div className="stat-content">
            <div className="stat-value">{loading ? '—' : stats?.institutionAdmins ?? 0}</div>
            <div className="stat-label">Institution Admins</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)', fontWeight: 700, fontSize: '16px' }}>$</div>
          <div className="stat-content">
            <div className="stat-value">{loading ? '—' : stats?.activeSubscriptions ?? 0}</div>
            <div className="stat-label">Active Subscriptions</div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text-primary)' }}>Onboarding Quick Actions</h2>
      <div className="onboarding-grid">
        <div className="onboarding-card">
          <div className="step-number">1</div>
          <h3>Create &amp; Configure Institution</h3>
          <p>Register new school or college with institution code, departments, academic years, and subscription tier.</p>
          <button className="btn btn-primary" onClick={() => onNavigate('institutions')}>
            Manage Institutions
          </button>
        </div>

        <div className="onboarding-card">
          <div className="step-number">2</div>
          <h3>Create Institution Administrator</h3>
          <p>Generate administrator credentials for an onboarded institution. Admins can log in directly on the mobile app.</p>
          <button className="btn btn-primary" onClick={() => onNavigate('admins')}>
            Manage Admins
          </button>
        </div>
      </div>
    </div>
  );
};
