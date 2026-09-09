import React, { useState } from 'react';
import { useClub } from '../../context/ClubContext';
import { ShieldCheck, Search, Edit2, CheckCircle2, X, Trash2, KeyRound, Ban, UserCheck } from 'lucide-react';

export function RoleManager() {
  const { data, updateUserRole, toggleUserStatus, deleteUserAccount, resetUserPassword, currentUser } = useClub();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [tempRole, setTempRole] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Modals state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [passwordResetId, setPasswordResetId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Staff only — regular members are excluded from Role Management
  const allUsers = [
    ...(data.adminUsers || []).map(u => ({ ...u, userType: 'Staff' })),
  ].filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (user) => {
    setEditingId(user.id);
    setTempRole(user.role);
  };

  const handleSaveRole = async (user) => {
    setIsUpdating(true);
    await updateUserRole(user.id, tempRole, user.userType === 'Staff');
    setIsUpdating(false);
    setEditingId(null);
  };

  const getRoleOptions = (userType) => {
    if (userType === 'Staff') {
      return ['Admin', 'Core Lead', 'Faculty Advisor', 'Event Coordinator'];
    }
    return ['Member', 'Core Team', 'Lead'];
  };

  const handleDelete = async (user) => {
    setIsUpdating(true);
    await deleteUserAccount(user.id, user.userType === 'Staff');
    setIsUpdating(false);
    setDeleteConfirmId(null);
  };

  const handleToggleStatus = async (user) => {
    const isStaff = user.userType === 'Staff';
    const isCurrentlyActive = isStaff ? user.isActive : user.status !== 'Suspended';
    setIsUpdating(true);
    await toggleUserStatus(user.id, isStaff, !isCurrentlyActive);
    setIsUpdating(false);
  };

  const handlePasswordReset = async (user) => {
    if (!newPassword || newPassword.length < 8) return;
    setIsUpdating(true);
    await resetUserPassword(user.id, newPassword);
    setIsUpdating(false);
    setPasswordResetId(null);
    setNewPassword('');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Role Management Dashboard</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Monitor and assign roles for all members and staff</p>
            </div>
          </div>
        </div>

        <div className="search-bar" style={{ flex: '1 1 300px', maxWidth: '400px' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(241, 245, 249, 0.5)', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '16px 20px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>User</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Type</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Current Role</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No users found matching "{searchTerm}"
                  </td>
                </tr>
              ) : (
                allUsers.map(user => {
                  const isStaff = user.userType === 'Staff';
                  const isActive = isStaff ? user.isActive : user.status !== 'Suspended';
                  return (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-light)', opacity: isActive ? 1 : 0.6 }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                          src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                          alt={user.name} 
                          style={{ width: '36px', height: '36px', borderRadius: '50%' }} 
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {user.name}
                            {user.id === currentUser?.id && <span style={{ fontSize: '0.65rem', background: '#e0e7ff', color: '#4f46e5', padding: '2px 6px', borderRadius: '4px' }}>YOU</span>}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: isActive ? '#10b981' : '#f43f5e', fontWeight: 600 }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isActive ? '#10b981' : '#f43f5e' }} />
                        {isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '100px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: user.userType === 'Staff' ? '#e0e7ff' : '#f1f5f9',
                        color: user.userType === 'Staff' ? '#4f46e5' : '#64748b'
                      }}>
                        {user.userType}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {editingId === user.id ? (
                        <select
                          value={tempRole}
                          onChange={(e) => setTempRole(e.target.value)}
                          className="form-control"
                          style={{ minWidth: '150px', padding: '6px 12px', fontSize: '0.85rem' }}
                        >
                          {getRoleOptions(user.userType).map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{user.role}</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      {editingId === user.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button onClick={() => handleSaveRole(user)} disabled={isUpdating || tempRole === user.role} className="btn-icon" style={{ background: '#dcfce7', color: '#16a34a' }} title="Save Role">
                            <CheckCircle2 size={16} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="btn-icon" style={{ background: '#fee2e2', color: '#ef4444' }} title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      ) : deleteConfirmId === user.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>Delete?</span>
                          <button onClick={() => handleDelete(user)} disabled={isUpdating} className="btn-icon" style={{ background: '#fee2e2', color: '#ef4444' }} title="Confirm Delete">
                            <CheckCircle2 size={16} />
                          </button>
                          <button onClick={() => setDeleteConfirmId(null)} className="btn-icon" style={{ background: '#f1f5f9', color: '#64748b' }} title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      ) : passwordResetId === user.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <input type="text" placeholder="New Password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} style={{ padding: '4px 8px', fontSize: '0.75rem', width: '100px', borderRadius: '4px', border: '1px solid var(--border-light)' }} />
                          <button onClick={() => handlePasswordReset(user)} disabled={isUpdating || newPassword.length < 8} className="btn-icon" style={{ background: '#dcfce7', color: '#16a34a' }} title="Confirm Reset">
                            <CheckCircle2 size={16} />
                          </button>
                          <button onClick={() => setPasswordResetId(null)} className="btn-icon" style={{ background: '#f1f5f9', color: '#64748b' }} title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button onClick={() => handleEditClick(user)} className="btn-icon" style={{ color: 'var(--cyan-accent)', background: 'rgba(6,182,212,0.1)' }} title="Edit Role">
                            <Edit2 size={16} />
                          </button>
                          {isStaff && (
                            <button onClick={() => setPasswordResetId(user.id)} className="btn-icon" style={{ color: '#f59e0b', background: '#fef3c7' }} title="Reset Password">
                              <KeyRound size={16} />
                            </button>
                          )}
                          {user.id !== currentUser?.id && (
                            <button onClick={() => handleToggleStatus(user)} disabled={isUpdating} className="btn-icon" style={{ color: isActive ? '#f97316' : '#10b981', background: isActive ? '#ffedd5' : '#dcfce7' }} title={isActive ? 'Suspend User' : 'Activate User'}>
                              {isActive ? <Ban size={16} /> : <UserCheck size={16} />}
                            </button>
                          )}
                          {user.id !== currentUser?.id && (
                            <button onClick={() => setDeleteConfirmId(user.id)} className="btn-icon" style={{ color: '#ef4444', background: '#fee2e2' }} title="Delete Account">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
