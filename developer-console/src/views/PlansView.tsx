import React from 'react';

export const PlansView: React.FC = () => {
  return (
    <div>
      <div className="header-bar">
        <div>
          <h1 className="page-title">Subscription Plans</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Configure tier limits, features, and pricing structures
          </p>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>💳</div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Subscription Billing Engine</h3>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
          Subscription plan limits, billing integration, and tier enforcement will be introduced in an upcoming sprint.
        </p>
      </div>
    </div>
  );
};
