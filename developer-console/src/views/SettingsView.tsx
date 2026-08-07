import React from 'react';

export const SettingsView: React.FC = () => {
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
    </div>
  );
};
