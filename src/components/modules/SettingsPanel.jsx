import React, { useState } from 'react';
import { useClub } from '../../context/ClubContext';
import {
  Palette,
  Share2,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Lock
} from 'lucide-react';

export function SettingsPanel() {
  const {
    data,
    updateBranding,
    updateSocials,
    resetToDefaults,
    exportDatabaseJSON,
    importDatabaseJSON,
    updateAdminInviteKey
  } = useClub();

  const [brandingForm, setBrandingForm] = useState(data.branding);
  const [socialsForm, setSocialsForm] = useState(data.branding.socials);
  const [newAdminKey, setNewAdminKey] = useState('');

  const handleBrandingSave = (e) => {
    e.preventDefault();
    updateBranding(brandingForm);
  };

  const handleSocialsSave = (e) => {
    e.preventDefault();
    updateSocials(socialsForm);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        importDatabaseJSON(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleAdminKeySave = async (e) => {
    e.preventDefault();
    if (!newAdminKey) return;
    const res = await updateAdminInviteKey(newAdminKey);
    if (res.success) {
      setNewAdminKey('');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Bar */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Club Branding & System Settings</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Configure institutional identity, appearance colors, social integrations, and database backup
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
        {/* Branding Configuration */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--cyan-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cyan-accent)'
              }}
            >
              <Palette size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Club Identity & Profile</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Name, motto, and logo details</p>
            </div>
          </div>

          <form onSubmit={handleBrandingSave}>
            <div className="form-group">
              <label className="form-label">Official Club Name *</label>
              <input
                type="text"
                required
                value={brandingForm.clubName}
                onChange={(e) => setBrandingForm({ ...brandingForm, clubName: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Club Motto / Tagline</label>
              <input
                type="text"
                value={brandingForm.tagline}
                onChange={(e) => setBrandingForm({ ...brandingForm, tagline: e.target.value })}
                className="form-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">University / Institute</label>
                <input
                  type="text"
                  value={brandingForm.university}
                  onChange={(e) => setBrandingForm({ ...brandingForm, university: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Founded Year</label>
                <input
                  type="text"
                  value={brandingForm.foundedYear}
                  onChange={(e) => setBrandingForm({ ...brandingForm, foundedYear: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input
                type="email"
                value={brandingForm.contactEmail}
                onChange={(e) => setBrandingForm({ ...brandingForm, contactEmail: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Logo Image URL</label>
              <input
                type="text"
                value={brandingForm.logoUrl}
                onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                className="form-input"
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
              <CheckCircle2 size={16} />
              <span>Save Identity Changes</span>
            </button>
          </form>
        </div>

        {/* Social Media & Community Links */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#f5f3ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8b5cf6'
              }}
            >
              <Share2 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Community & Social Links</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Public portals & repositories</p>
            </div>
          </div>

          <form onSubmit={handleSocialsSave}>
            <div className="form-group">
              <label className="form-label">GitHub Organization</label>
              <input
                type="url"
                value={socialsForm.github || ''}
                onChange={(e) => setSocialsForm({ ...socialsForm, github: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Discord Server Invite</label>
              <input
                type="url"
                value={socialsForm.discord || ''}
                onChange={(e) => setSocialsForm({ ...socialsForm, discord: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">LinkedIn Page</label>
              <input
                type="url"
                value={socialsForm.linkedin || ''}
                onChange={(e) => setSocialsForm({ ...socialsForm, linkedin: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">HuggingFace Organization</label>
              <input
                type="url"
                value={socialsForm.huggingface || ''}
                onChange={(e) => setSocialsForm({ ...socialsForm, huggingface: e.target.value })}
                className="form-input"
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
              <CheckCircle2 size={16} />
              <span>Update Social Links</span>
            </button>
          </form>
        </div>

        {/* Security & Access Control */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444'
              }}
            >
              <Lock size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Security & Access Control</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Manage admin verification passkey</p>
            </div>
          </div>

          <form onSubmit={handleAdminKeySave}>
            <div className="form-group">
              <label className="form-label">New Admin Verification Key</label>
              <input
                type="password"
                required
                value={newAdminKey}
                onChange={(e) => setNewAdminKey(e.target.value)}
                className="form-input"
                placeholder="Enter new passkey"
              />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                This key is required by new staff to register as administrators. Changing this will invalidate the old key.
              </p>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px', background: '#ef4444', color: 'white', border: 'none' }}>
              <CheckCircle2 size={16} />
              <span>Update Verification Key</span>
            </button>
          </form>
        </div>

        {/* Database & Data Integrity Backup */}
        <div className="glass-panel" style={{ padding: '24px', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981'
              }}
            >
              <Database size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Data Management & Backups</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Export your state or reset configuration
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginTop: '16px'
            }}
          >
            {/* Export JSON */}
            <div
              style={{
                padding: '18px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-glass-subtle)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>Export Portal JSON</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Download the entire state including all members, events, CMS articles, and projects as a portable JSON snapshot.
                </div>
              </div>
              <button onClick={exportDatabaseJSON} className="btn btn-secondary" style={{ width: '100%' }}>
                <Download size={16} />
                <span>Download Database JSON</span>
              </button>
            </div>

            {/* Import JSON */}
            <div
              style={{
                padding: '18px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-glass-subtle)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>Import Portal Backup</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Restore previously exported club database JSON backup file into the browser.
                </div>
              </div>
              <label className="btn btn-secondary" style={{ width: '100%', cursor: 'pointer' }}>
                <Upload size={16} />
                <span>Upload JSON Backup</span>
                <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Reset Defaults */}
            <div
              style={{
                padding: '18px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--rose-soft)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e11d48', marginBottom: '4px' }}>
                  Restore Demo State
                </div>
                <div style={{ fontSize: '0.78rem', color: '#9f1239' }}>
                  Reset all club data, projects, CMS pages, and member directory to initial clean demo data.
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset all data to default demo state?')) {
                    resetToDefaults();
                  }
                }}
                className="btn btn-danger"
                style={{ width: '100%' }}
              >
                <RotateCcw size={16} />
                <span>Reset to Factory Defaults</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
