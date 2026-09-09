import React, { useState, useEffect } from 'react';
import { useClub } from '../../context/ClubContext';
import { Clock, Filter, Search, ShieldCheck } from 'lucide-react';

export function ActivityAudit() {
  const { currentUser, addToast } = useClub();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/admin/logs', {
          headers: { Authorization: `Bearer ${currentUser?.token}` }
        });
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        addToast('Failed to load audit logs', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (currentUser?.isAdmin) {
      fetchLogs();
    }
  }, [currentUser, addToast]);

  const filteredLogs = logs.filter(log => 
    (log.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.target || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <span className="badge" style={{ background: 'var(--rose-soft)', color: 'var(--rose)', marginBottom: '8px' }}>Security & Compliance</span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Activity Audit Logs</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Monitor all user activities and systemic actions across the platform.</p>
        </div>
        <div style={{ padding: '12px 20px', background: 'var(--bg-glass-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={24} color="var(--emerald)" />
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>SYSTEM STATUS</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--emerald)' }}>Secure & Auditing</div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-glass-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '400px', background: 'var(--bg-surface)', padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search by user, action, or target..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--text-primary)' }}
            />
          </div>
          <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <Filter size={16} /> Filter Logs
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'var(--bg-glass-subtle)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '16px 24px', fontWeight: 700 }}>Timestamp</th>
                <th style={{ padding: '16px 24px', fontWeight: 700 }}>User / Actor</th>
                <th style={{ padding: '16px 24px', fontWeight: 700 }}>Action Taken</th>
                <th style={{ padding: '16px 24px', fontWeight: 700 }}>Target / Resource</th>
                <th style={{ padding: '16px 24px', fontWeight: 700 }}>Module</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--cyan-soft)', color: 'var(--cyan-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                          {log.userName ? log.userName.charAt(0) : 'S'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{log.userName || 'System'}</div>
                          {log.user?.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.user.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {log.action}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {log.target || '-'}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className="badge" style={{ background: 'var(--bg-glass-subtle)', border: '1px solid var(--border-glass)' }}>
                        {log.type || 'system'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
