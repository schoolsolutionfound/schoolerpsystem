import { useState, useEffect } from 'react';
import { auth, signOut } from './services/firebase';
import { Navigation } from './components/Navigation';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { InstitutionsView } from './views/InstitutionsView';
import { AdminsView } from './views/AdminsView';
import { PlansView } from './views/PlansView';
import { SettingsView } from './views/SettingsView';

export function App() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email || 'developer@schoolerp.com');
      } else {
        setUserEmail(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('[Logout Error]', err);
    }
    setUserEmail(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
        <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Loading Developer Console...</div>
      </div>
    );
  }

  if (!userEmail) {
    return <LoginView onLoginSuccess={(email) => setUserEmail(email)} />;
  }

  return (
    <div className="app-container">
      <Navigation
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        userEmail={userEmail}
        onLogout={handleLogout}
      />
      <main className="main-content">
        {currentTab === 'dashboard' && <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />}
        {currentTab === 'institutions' && <InstitutionsView />}
        {currentTab === 'admins' && <AdminsView />}
        {currentTab === 'plans' && <PlansView />}
        {currentTab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}

export default App;
