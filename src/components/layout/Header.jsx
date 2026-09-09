import React, { useState } from 'react';
import { useClub } from '../../context/ClubContext';
import {
  Search,
  Bell,
  Sun,
  Moon,
  ExternalLink,
  Plus,
  Radio,
  Calendar,
  UserPlus,
  Megaphone,
  X,
  LogOut
} from 'lucide-react';

export function Header() {
  const {
    setActiveTab,
    globalSearch,
    setGlobalSearch,
    theme,
    toggleTheme,
    setIsLivePreviewOpen,
    currentUser,
    logout,
    data
  } = useClub();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  return (
    <header
      style={{
        height: '72px',
        padding: '0 32px',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 30
      }}
    >
      {/* Title & Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            Hi, {currentUser?.name || 'User'}
          </h1>
        </div>

        {/* Global Search Bar */}
        <div
          style={{
            position: 'relative',
            width: '320px',
            maxWidth: '100%'
          }}
          className="search-container"
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            placeholder="Search members, events, projects..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '999px',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-surface)',
              fontSize: '0.84rem',
              outline: 'none',
              transition: 'all var(--transition-fast)'
            }}
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '2px'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Quick Action Dropdown — admin/staff only */}
        {currentUser?.isAdmin || (currentUser?.role && currentUser.role !== 'Member') ? (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
            className="btn btn-primary"
            style={{ padding: '8px' }}
            title="Quick Create"
          >
            <Plus size={18} />
          </button>

          {isQuickActionsOpen && (
            <>
              <div
                onClick={() => setIsQuickActionsOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 45 }}
              />
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  width: '210px',
                  padding: '8px',
                  zIndex: 50,
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                <button
                  onClick={() => {
                    setActiveTab('learning');
                    setIsQuickActionsOpen(false);
                  }}
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.84rem', padding: '8px 10px' }}
                >
                  <Plus size={16} color="var(--cyan-accent)" />
                  <span>Post AI Lesson / Code</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('members');
                    setIsQuickActionsOpen(false);
                  }}
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.84rem', padding: '8px 10px' }}
                >
                  <UserPlus size={16} color="#06b6d4" />
                  <span>Add Member</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('events');
                    setIsQuickActionsOpen(false);
                  }}
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.84rem', padding: '8px 10px' }}
                >
                  <Calendar size={16} color="#0ea5e9" />
                  <span>Create Workshop</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('cms');
                    setIsQuickActionsOpen(false);
                  }}
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.84rem', padding: '8px 10px' }}
                >
                  <Megaphone size={16} color="#8b5cf6" />
                  <span>Post Announcement</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('notifications');
                    setIsQuickActionsOpen(false);
                  }}
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.84rem', padding: '8px 10px' }}
                >
                  <Radio size={16} color="#f43f5e" />
                  <span>Broadcast Alert</span>
                </button>
              </div>
            </>
          )}
        </div>
        ) : null}

        {/* Live Site Preview Toggle */}
        <button
          onClick={() => setIsLivePreviewOpen(true)}
          className="btn btn-secondary"
          style={{ padding: '8px' }}
          title="Live Preview"
        >
          <ExternalLink size={18} color="var(--cyan-accent)" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn-icon"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} color="#f59e0b" />}
        </button>

        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="btn-icon"
            style={{ position: 'relative' }}
            title="Notifications"
          >
            <Bell size={18} />
            <div
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#f43f5e'
              }}
            />
          </button>

          {isNotifOpen && (
            <>
              <div
                onClick={() => setIsNotifOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 45 }}
              />
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  width: '320px',
                  padding: '16px',
                  zIndex: 50,
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Recent Broadcasts & Alerts</div>
                  <span className="badge badge-cyan">{data.notifications?.length || 0} Sent</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                  {data.notifications && data.notifications.length > 0 ? (
                    data.notifications.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          background: '#f8fafc',
                          border: '1px solid var(--border-light)',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                          {n.title}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: '1.4' }}>
                          {n.message}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          <span>{n.audience}</span>
                          <span>{n.sentAt}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '16px 0' }}>
                      No recent notifications
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Admin Profile Pill */}
        {currentUser && (
          <div
            className="admin-profile-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px 4px 4px',
              borderRadius: '999px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <style>
              {`
                .admin-profile-pill .logout-btn-header {
                  opacity: 0;
                  transform: translateX(-5px);
                  transition: all 0.3s ease;
                  pointer-events: none;
                  width: 0;
                  overflow: hidden;
                }
                .admin-profile-pill:hover .logout-btn-header {
                  opacity: 1;
                  transform: translateX(0);
                  pointer-events: auto;
                  width: 24px;
                }
              `}
            </style>
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--cyan-soft)', color: 'var(--cyan-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {currentUser.name.split(' ')[0]}
              </span>
              <span style={{ fontSize: '0.66rem', color: 'var(--cyan-accent)', fontWeight: 600 }}>
                {currentUser.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="btn-icon logout-btn-header"
              style={{ color: '#f43f5e', padding: '4px', marginLeft: '4px', display: 'flex', justifyContent: 'center' }}
              title="Sign Out of Admin Portal"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
