import React from 'react';

export const PlansView: React.FC = () => {
  return (
    <div>
      <div className="header-bar">
        <div>
          <h1 className="page-title">Subscription Plans</h1>
          <p className="page-subtitle">Configure tier limits, features, and pricing structures</p>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: '28px', marginBottom: '16px', opacity: 0.4, fontWeight: 700 }}>$</div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Subscription Billing Engine</h3>
        <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', maxWidth: '460px', margin: '0 auto', lineHeight: 1.6 }}>
          Subscription plan limits, billing integration, and tier enforcement will be introduced in an upcoming sprint.
        </p>
      </div>
    </div>
  );
};
