import React, { useState } from 'react';
import { useClub } from '../../context/ClubContext';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  GraduationCap,
  FileText,
  FolderGit2,
  BellRing,
  Settings,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  LogOut,
  UserPlus,
  Code2,
  UserCog
} from 'lucide-react';

export function Sidebar() {
  const { data, activeTab, setActiveTab, setIsLivePreviewOpen, currentUser, logout } = useClub();
  const [collapsed, setCollapsed] = useState(false);

  const isStaff = currentUser && currentUser.role !== 'Member';

  const allNavItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, badge: null, staffOnly: true },
    { id: 'profile', label: 'My Dashboard', icon: GraduationCap, badge: null, staffOnly: false },
    { id: 'ide', label: 'Web IDE', icon: Code2, badge: 'Beta', staffOnly: false },
    { id: 'forum', label: 'Discussion Forum', icon: Users, badge: null, staffOnly: false },
    { id: 'join-requests', label: 'Join Requests', icon: UserPlus, badge: (data.joinRequests || []).filter(r => r.status === 'Pending').length || null, staffOnly: true },
    { id: 'learning', label: 'Learning Hub & LMS', icon: GraduationCap, badge: data.learningResources?.length, staffOnly: true },
    { id: 'members', label: 'Member Directory', icon: Users, badge: data.members?.length, staffOnly: true },
    { id: 'events', label: 'Events & Workshops', icon: CalendarDays, badge: data.events?.length, staffOnly: true },
    { id: 'cms', label: 'Content CMS', icon: FileText, badge: 'Live', staffOnly: true },
    { id: 'projects', label: 'Project Showcase', icon: FolderGit2, badge: data.projects?.length, staffOnly: true },
    { id: 'notifications', label: 'Broadcast Center', icon: BellRing, badge: null, staffOnly: true },
    { id: 'audit', label: 'Security & Audit', icon: ShieldCheck, badge: null, staffOnly: true },
    { id: 'settings', label: 'Branding & Settings', icon: Settings, badge: null, staffOnly: true },
  ];

  if (currentUser?.role === 'Core Lead' || currentUser?.role === 'Admin') {
    allNavItems.splice(4, 0, { id: 'roles', label: 'Role Management', icon: UserCog, badge: 'Lead', staffOnly: true });
  }

  const navItems = allNavItems.filter(item => isStaff || !item.staffOnly);

  return (
    <aside
      style={{
        width: collapsed ? '80px' : '280px',
        minWidth: collapsed ? '80px' : '280px',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        background: 'var(--bg-glass-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-glass)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: 'var(--shadow-glass)'
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: collapsed ? '18px 12px' : '20px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid var(--border-glass)',
          justifyContent: collapsed ? 'center' : 'space-between',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              minWidth: '38px',
              borderRadius: '10px',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #e0f2fe, #e0e7ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid var(--cyan-border)',
              boxShadow: '0 2px 8px rgba(6, 182, 212, 0.2)'
            }}
          >
            <img
              src={data.branding.logoUrl || '/axion_logo.jpg'}
              alt="Club Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          {!collapsed && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {data.branding.clubName || 'AXION'}
                <Sparkles size={13} color="var(--cyan-accent)" />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Admin Control Center
              </div>
            </div>
          )}
        </div>

        {/* Floating border collapse toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn-icon"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          style={{
            position: 'absolute',
            right: '-13px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 60,
            color: 'var(--text-secondary)',
            padding: 0
          }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation List */}
      <div style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700, padding: collapsed ? '4px 0' : '8px 12px', textAlign: collapsed ? 'center' : 'left' }}>
          {collapsed ? '•' : 'Management Modules'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: collapsed ? '12px' : '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(14, 165, 233, 0.08))' : 'transparent',
                color: isActive ? 'var(--cyan-accent)' : 'var(--text-secondary)',
                border: isActive ? '1px solid var(--cyan-border)' : '1px solid transparent',
                cursor: 'pointer',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.875rem',
                transition: 'all var(--transition-fast)',
                justifyContent: collapsed ? 'center' : 'flex-start',
                position: 'relative'
              }}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={19} color={isActive ? 'var(--cyan-accent)' : 'currentColor'} />
              
              {!collapsed && (
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              )}

              {!collapsed && item.badge !== null && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    background: isActive ? 'var(--cyan-accent)' : '#f1f5f9',
                    color: isActive ? '#ffffff' : '#64748b',
                    fontWeight: 700
                  }}
                >
                  {item.badge}
                </span>
              )}

              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    bottom: '20%',
                    width: '3px',
                    borderRadius: '0 4px 4px 0',
                    background: 'var(--cyan-accent)'
                  }}
                />
              )}
            </button>
          );
        })}

        <div style={{ margin: '12px 0', borderTop: '1px solid var(--border-glass)' }} />

        {/* Live Public Site Button */}
        <button
          onClick={() => setIsLivePreviewOpen(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: collapsed ? '12px' : '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #f0fdfa, #f0f9ff)',
            color: '#0891b2',
            border: '1px solid var(--cyan-border)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.84rem',
            justifyContent: collapsed ? 'center' : 'flex-start'
          }}
          title="Open Live Public Club Portal"
        >
          <ExternalLink size={17} />
          {!collapsed && <span>Live Public Site</span>}
        </button>
      </div>

      {/* Admin User Footer */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--border-glass)',
          background: 'var(--bg-glass-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          {!collapsed && (
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span>{currentUser?.name || 'Administrator'}</span>
                <ShieldCheck size={13} color="#0ea5e9" style={{ flexShrink: 0 }} />
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.role || 'Staff Access'}
              </div>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={logout}
            className="btn-icon"
            style={{ color: '#f43f5e', padding: '6px' }}
            title="Sign Out of Admin Portal"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
