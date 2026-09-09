import React from 'react';
import { ClubProvider, useClub } from './context/ClubContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardOverview } from './components/modules/DashboardOverview';
import { MemberManager } from './components/modules/MemberManager';
import { EventManager } from './components/modules/EventManager';
import { LearningManager } from './components/modules/LearningManager';
import { CMSManager } from './components/modules/CMSManager';
import { ProjectShowcase } from './components/modules/ProjectShowcase';
import { NotificationCenter } from './components/modules/NotificationCenter';
import { SettingsPanel } from './components/modules/SettingsPanel';
import { JoinRequests } from './components/modules/JoinRequests';
import UserDashboard from './components/modules/UserDashboard';
import { IDE } from './components/modules/IDE';
import DiscussionForum from './components/modules/DiscussionForum';
import { ActivityAudit } from './components/modules/ActivityAudit';
import { RoleManager } from './components/modules/RoleManager';
import { LivePortalPreview } from './components/public/LivePortalPreview';
import { LandingPage } from './components/public/LandingPage';
import { AdminLogin } from './components/auth/AdminLogin';

import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

function DashboardShell() {
  const {
    activeTab,
    isLivePreviewOpen,
    isAuthenticated,
    isAdminLoginOpen,
    setIsAdminLoginOpen,
    currentUser,
    toasts,
    removeToast
  } = useClub();

  React.useEffect(() => {
    if (window.location.pathname === '/admin') {
      if (!isAuthenticated) {
        setIsAdminLoginOpen(true);
      }
      window.history.replaceState({}, document.title, '/');
    }
  }, [isAuthenticated, setIsAdminLoginOpen]);

  const isStaff = currentUser && currentUser.role !== 'Member';

  const renderActiveModule = () => {
    if (!isStaff && !['profile', 'forum', 'ide'].includes(activeTab)) {
      return <UserDashboard />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'learning':
        return <LearningManager />;
      case 'join-requests':
        return <JoinRequests />;
      case 'members':
        return <MemberManager />;
      case 'events':
        return <EventManager />;
      case 'cms':
        return <CMSManager />;
      case 'projects':
        return <ProjectShowcase />;
      case 'notifications':
        return <NotificationCenter />;
      case 'settings':
        return <SettingsPanel />;
      case 'roles':
        return <RoleManager />;
      case 'audit':
        return <ActivityAudit />;
      case 'profile':
        return <UserDashboard />;
      case 'ide':
        return <IDE />;
      case 'forum':
        return <DiscussionForum />;
      default:
        return isStaff ? <DashboardOverview /> : <UserDashboard />;
    }
  };



  return (
    <>
      {!isAuthenticated ? (
        <LandingPage />
      ) : (
        (!isLivePreviewOpen) ? (
          <div className="app-container">
            {/* Navigation Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="main-content">
              <Header />
              <div className="content-body">
                {renderActiveModule()}
              </div>
            </main>
          </div>
        ) : (
          <LivePortalPreview />
        )
      )}

      {/* Admin Login Modal (Triggered when staff clicks Staff Login or tries to access admin) */}
      {isAdminLoginOpen && (
        <AdminLogin onClose={() => setIsAdminLoginOpen(false)} />
      )}

      {/* Toast Alerts Container */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 300,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px'
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="glass-panel animate-fade-in"
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              background: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-lg)',
              borderLeft: `4px solid ${
                t.type === 'success' ? '#10b981' : t.type === 'error' ? '#f43f5e' : 'var(--cyan-accent)'
              }`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {t.type === 'success' ? (
                <CheckCircle2 size={18} color="#10b981" />
              ) : t.type === 'error' ? (
                <AlertCircle size={18} color="#f43f5e" />
              ) : (
                <Info size={18} color="var(--cyan-accent)" />
              )}
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {t.message}
              </span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="btn-icon"
              style={{ padding: '2px' }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export default function App() {
  return (
    <ClubProvider>
      <DashboardShell />
    </ClubProvider>
  );
}
