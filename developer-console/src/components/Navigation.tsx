import React from 'react';

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  userEmail: string;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  userEmail,
  onLogout,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'institutions', label: 'Institutions', icon: '🏫' },
    { id: 'admins', label: 'Institution Admins', icon: '👥' },
    { id: 'plans', label: 'Subscription Plans', icon: '💳' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="sidebar">
      <div className="brand-header">
        <div className="brand-icon">👑</div>
        <div>
          <div className="brand-title">Developer Console</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>School ERP Platform</div>
        </div>
      </div>

      <ul className="nav-list">
        {navItems.map((item) => (
          <li key={item.id}>
            <button
              className={`nav-item ${currentTab === item.id ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="user-footer">
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
          {userEmail || 'Developer'}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
          Super Admin
        </div>
        <button className="btn btn-outline" style={{ width: '100%', fontSize: '12px', height: '32px' }} onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
};
