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
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'institutions', label: 'Institutions' },
    { id: 'admins', label: 'Institution Admins' },
    { id: 'plans', label: 'Subscription Plans' },
    { id: 'settings', label: 'Settings' },
  ];

  const initials = (userEmail || 'D').charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="brand-header">
        <div className="brand-icon">S</div>
        <div>
          <div className="brand-title">SchoolERP</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '1px' }}>Developer Console</div>
        </div>
      </div>

      <div className="nav-section-label">Main Menu</div>
      <ul className="nav-list">
        {navItems.map((item) => (
          <li key={item.id}>
            <button
              className={`nav-item ${currentTab === item.id ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="user-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div className="user-avatar">{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userEmail || 'Developer'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
              Super Admin
            </div>
          </div>
        </div>
        <button className="btn btn-secondary" style={{ width: '100%', height: '32px', fontSize: '12px' }} onClick={onLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
};
