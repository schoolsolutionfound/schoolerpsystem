import React from 'react';

export const SettingsView: React.FC = () => {
  return (
    <div>
      <div className="header-bar">
        <div>
          <h1 className="page-title">Developer Settings</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            System configuration, API keys, and platform preferences
          </p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Platform Configuration</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Firebase Environment</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Identity Provider</div>
            </div>
            <span className="badge badge-active">Connected</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>PostgreSQL Database</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Primary ERP Business Store</div>
            </div>
            <span className="badge badge-active">Connected</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Fastify API Gateway</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Backend Microservice Layer</div>
            </div>
            <span className="badge badge-active">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
