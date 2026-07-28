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
          <h1 className="page-title">Developer Dashboard</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            ERP Platform Control Center & Institution Onboarding
          </p>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-icon">🏫</div>
          <div>
            <div className="stat-value">{loading ? '...' : stats?.totalInstitutions ?? 0}</div>
            <div className="stat-label">Total Institutions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div>
            <div className="stat-value">{loading ? '...' : stats?.activeInstitutions ?? 0}</div>
            <div className="stat-label">Active Institutions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div>
            <div className="stat-value">{loading ? '...' : stats?.institutionAdmins ?? 0}</div>
            <div className="stat-label">Institution Admins</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💳</div>
          <div>
            <div className="stat-value">{loading ? '...' : stats?.activeSubscriptions ?? 0}</div>
            <div className="stat-label">Active Subscriptions</div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Onboarding Quick Actions</h2>
      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>1. Create & Configure Institution</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Register new school or college with institution code, departments, academic years, and subscription tier.
          </p>
          <button className="btn btn-primary" onClick={() => onNavigate('institutions')}>
            Manage Institutions →
          </button>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>2. Create Institution Administrator</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Generate administrator credentials for an onboarded institution. Admins can log in directly on the mobile app.
          </p>
          <button className="btn btn-primary" onClick={() => onNavigate('admins')}>
            Manage Admins →
          </button>
        </div>
      </div>
    </div>
  );
};
