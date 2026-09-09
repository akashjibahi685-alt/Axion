import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialClubData } from '../data/initialData';


const ClubContext = createContext(null);
const STORAGE_KEY = 'axion_club_v4';
const STUDENT_PROGRESS_KEY = 'axion_student_progress_v1';
const AUTH_SESSION_KEY = 'axion_admin_session_v1';

export function ClubProvider({ children }) {
  const [data, setData] = useState(initialClubData);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Authentication State — declared first so authFetch can use it
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem(AUTH_SESSION_KEY);
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Error loading auth session', err);
    }
    return null;
  });

  // Helper: send authenticated fetch requests with the current user's JWT token
  const authFetch = (url, options = {}) => {
    const token = currentUser?.token;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    return fetch(url, { ...options, headers });
  };

  // On mount: restore data from localStorage cache immediately
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setData(prev => ({ ...prev, ...parsed }));
      }
    } catch (e) { /* ignore */ }
    setIsDataLoaded(true);
  }, []);

  // Re-fetch fresh backend data whenever the user logs in
  useEffect(() => {
    if (!currentUser?.token) return;
    authFetch('/api/init')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setData(prev => {
            const nextData = { ...prev, ...json.data };
            if (json.data.cmsPages) {
              nextData.cmsPages = { ...prev.cmsPages, ...json.data.cmsPages };
            }
            return nextData;
          });
        }
      })
      .catch(err => console.error('Failed to fetch initial data from backend:', err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.token]);

  const isAuthenticated = !!currentUser;

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = sessionStorage.getItem('axion_active_tab');
      if (saved) return saved;
    } catch (err) {
      console.error('Error loading active tab', err);
    }
    return 'dashboard';
  });
  const [isLivePreviewOpen, setIsLivePreviewOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState('light');
  const [completedLessons, setCompletedLessons] = useState(() => {
    try {
      const saved = localStorage.getItem(STUDENT_PROGRESS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Error loading progress', err);
    }
    return ['lrn-01'];
  });

  // Sync to localStorage
  useEffect(() => {
    // Only save to localStorage as a fallback cache, backend is truth
    if (isDataLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.error('Error saving data to localStorage', err);
      }
    }
  }, [data, isDataLoaded]);

  useEffect(() => {
    try {
      if (currentUser) {
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(currentUser));
      } else {
        sessionStorage.removeItem(AUTH_SESSION_KEY);
      }
    } catch (err) {
      console.error('Error saving auth session', err);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STUDENT_PROGRESS_KEY, JSON.stringify(completedLessons));
    } catch (err) {
      console.error('Error saving student progress', err);
    }
  }, [completedLessons]);

  useEffect(() => {
    try {
      sessionStorage.setItem('axion_active_tab', activeTab);
    } catch (err) {
      console.error('Error saving active tab', err);
    }
  }, [activeTab]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Toast Notification helper
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addToast = (message, type = 'success') => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Helper to log dynamic admin activity
  const logActivity = (action, target, type = 'general') => {
    const newActivity = {
      id: 'act-' + Date.now(),
      user: currentUser ? currentUser.name : 'Administrator',
      action,
      target,
      time: 'Just now',
      type
    };
    setData((prev) => ({
      ...prev,
      activityLog: [newActivity, ...(prev.activityLog || []).slice(0, 15)]
    }));
  };

  // ==================== AUTHENTICATION METHODS ====================
  // SECURITY: All password comparisons use salted SHA-256 hashing (authUtils.js).
  // Plaintext passwords are never stored anywhere in the codebase.

  // Hashed value of the admin invite key 'axion_admin_key_v1'

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCurrentUser(data.user);
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(data.user));
        setIsAdminLoginOpen(false);
        addToast(`Welcome back, ${data.user.name}! Authorized as ${data.user.role}.`, 'success');
        return { success: true };
      } else {
        return {
          success: false,
          error: data.error || 'Invalid credentials or account not yet approved by Administration.'
        };
      }
    } catch (err) {
      console.error('Login fetch error:', err);
      return { success: false, error: 'Failed to connect to the server.' };
    }
  };

  const registerAdmin = async ({ name, email, password, role, adminSecretKey, department }) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, adminSecretKey, department })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.pending) {
          setIsAdminLoginOpen(false);
          addToast(data.message, 'success');
          return { success: true, pending: true };
        } else {
          setCurrentUser(data.user);
          sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(data.user));
          setIsAdminLoginOpen(false);
          addToast(`Account created! Welcome, ${data.user.name}.`, 'success');
          return { success: true, user: data.user };
        }
      } else {
        return {
          success: false,
          error: data.error || 'Registration failed.'
        };
      }
    } catch (err) {
      console.error('Registration fetch error:', err);
      return { success: false, error: 'Failed to connect to the server.' };
    }
  };

  const logout = () => {
    if (currentUser) {
      logActivity('Signed out', currentUser.email, 'auth');
    }
    setCurrentUser(null);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    addToast('Signed out of Administrator session.', 'info');
  };

  const updateAdminInviteKey = async (newKey) => {
    try {
      const response = await fetch('/api/auth/admin/invite-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newKey })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        addToast('Admin Verification Key updated successfully!', 'success');
        logActivity('Updated Admin Verification Key', 'System Security', 'admin');
        return { success: true };
      } else {
        addToast(data.error || 'Failed to update Admin Verification Key', 'error');
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error('Update admin key error:', err);
      addToast('Network error while updating key', 'error');
      return { success: false, error: 'Network error' };
    }
  };

  const updateUserRole = async (userId, newRole, isStaff) => {
    try {
      let endpoint = '';
      let method = 'PUT';
      let payload = { role: newRole };

      if (isStaff) {
        endpoint = `/api/auth/admin/users/${userId}/role`;
        payload = { newRole };
      } else {
        // Find existing member to reuse other fields
        const member = data.members.find(m => m.id === userId);
        if (!member) return { success: false, error: 'Member not found' };
        endpoint = `/api/members/${userId}`;
        payload = { ...member, role: newRole };
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();

      if (res.ok && resData.success) {
        setData(prev => {
          if (isStaff) {
            return {
              ...prev,
              adminUsers: prev.adminUsers.map(u => u.id === userId ? { ...u, role: newRole } : u)
            };
          } else {
            return {
              ...prev,
              members: prev.members.map(m => m.id === userId ? { ...m, role: newRole } : m)
            };
          }
        });
        logActivity(`Updated role to ${newRole}`, isStaff ? 'Staff Directory' : 'Member Directory', 'admin');
        addToast('Role successfully updated', 'success');
        return { success: true };
      } else {
        addToast(resData.error || 'Failed to update role', 'error');
        return { success: false, error: resData.error };
      }
    } catch (e) {
      console.error('Error updating role:', e);
      addToast('Network error', 'error');
      return { success: false, error: 'Network error' };
    }
  };

  const toggleUserStatus = async (userId, isStaff, newStatus) => {
    try {
      let endpoint = '';
      let method = 'PUT';
      let payload = {};

      if (isStaff) {
        endpoint = `/api/auth/admin/users/${userId}/status`;
        payload = { isActive: newStatus };
      } else {
        const member = data.members.find(m => m.id === userId);
        if (!member) return { success: false, error: 'Member not found' };
        endpoint = `/api/members/${userId}`;
        payload = { ...member, status: newStatus ? 'Active' : 'Suspended' };
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();

      if (res.ok && resData.success) {
        setData(prev => {
          if (isStaff) {
            return { ...prev, adminUsers: prev.adminUsers.map(u => u.id === userId ? { ...u, isActive: newStatus } : u) };
          } else {
            return { ...prev, members: prev.members.map(m => m.id === userId ? { ...m, status: newStatus ? 'Active' : 'Suspended' } : m) };
          }
        });
        logActivity(`Account ${newStatus ? 'Activated' : 'Suspended'}`, 'Access Control', 'admin');
        addToast(`Account ${newStatus ? 'activated' : 'suspended'} successfully`, 'success');
        return { success: true };
      } else {
        addToast(resData.error || 'Failed to update status', 'error');
        return { success: false, error: resData.error };
      }
    } catch (e) {
      console.error('Error toggling status:', e);
      addToast('Network error', 'error');
      return { success: false, error: 'Network error' };
    }
  };

  const deleteUserAccount = async (userId, isStaff) => {
    try {
      const endpoint = isStaff ? `/api/auth/admin/users/${userId}` : `/api/members/${userId}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      const resData = await res.json();

      if (res.ok && resData.success) {
        setData(prev => {
          if (isStaff) {
            return { ...prev, adminUsers: prev.adminUsers.filter(u => u.id !== userId) };
          } else {
            return { ...prev, members: prev.members.filter(m => m.id !== userId) };
          }
        });
        logActivity('Deleted user account', 'Access Control', 'admin');
        addToast('Account permanently deleted', 'success');
        return { success: true };
      } else {
        addToast(resData.error || 'Failed to delete account', 'error');
        return { success: false, error: resData.error };
      }
    } catch (e) {
      console.error('Error deleting account:', e);
      addToast('Network error', 'error');
      return { success: false, error: 'Network error' };
    }
  };

  const resetUserPassword = async (userId, newPassword) => {
    try {
      const res = await fetch(`/api/auth/admin/users/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });
      const resData = await res.json();

      if (res.ok && resData.success) {
        logActivity('Reset staff password', 'Access Control', 'admin');
        addToast('Password successfully overridden', 'success');
        return { success: true };
      } else {
        addToast(resData.error || 'Failed to reset password', 'error');
        return { success: false, error: resData.error };
      }
    } catch (e) {
      console.error('Error resetting password:', e);
      addToast('Network error', 'error');
      return { success: false, error: 'Network error' };
    }
  };

  // ==================== JOIN REQUESTS ====================
  const submitJoinRequest = async (requestData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast(data.message || 'Join request submitted successfully. Please wait for admin approval.', 'success');
        
        // Refresh local admin data if logged in as admin
        if (currentUser?.isAdmin) {
          authFetch('/api/init').then(r => r.json()).then(d => {
            if (d.success) setData(prev => ({ ...prev, ...d.data }));
          });
        }
        return { success: true };
      } else {
        addToast(data.error || 'Failed to submit request.', 'error');
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error(err);
      addToast('Network error.', 'error');
      return { success: false };
    }
  };

  const approveJoinRequest = async (requestId) => {
    try {
      const res = await authFetch(`/api/admin/join-requests/${requestId}/approve`, {
        method: 'POST'
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        // Refresh the global data cache
        const initRes = await authFetch('/api/init');
        const initData = await initRes.json();
        if (initData.success) setData(prev => ({ ...prev, ...initData.data }));
        
        logActivity('Approved join request', resData.user.email, 'admin');
        addToast(`Member approved and added successfully!`, 'success');
      } else {
        addToast(resData.error || 'Failed to approve request', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error', 'error');
    }
  };

  const rejectJoinRequest = async (requestId) => {
    try {
      const res = await authFetch(`/api/admin/join-requests/${requestId}/reject`, {
        method: 'POST'
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        // Refresh the global data cache
        const initRes = await authFetch('/api/init');
        const initData = await initRes.json();
        if (initData.success) setData(prev => ({ ...prev, ...initData.data }));
        
        addToast('Request rejected', 'info');
      } else {
        addToast(resData.error || 'Failed to reject request', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error', 'error');
    }
  };

  // ==================== LEARNING & LMS MANAGEMENT ====================
  const addLearningDomain = async (domain) => {
    try {
      const res = await fetch('/api/learning/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(domain)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData((prev) => ({
          ...prev,
          learningDomains: [...(prev.learningDomains || []), resData.domain]
        }));
        logActivity('Created learning domain', domain.name, 'learning');
        addToast(`Learning domain "${domain.name}" created!`, 'success');
      } else {
        addToast('Failed to create learning domain', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while creating domain', 'error');
    }
  };

  const updateLearningDomain = async (id, updatedFields) => {
    try {
      const res = await fetch(`/api/learning/domains/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData((prev) => ({
          ...prev,
          learningDomains: (prev.learningDomains || []).map((d) =>
            d.id === id ? resData.domain : d
          )
        }));
        logActivity('Updated learning domain', updatedFields.name || id, 'learning');
        addToast('Learning domain updated', 'success');
      } else {
        addToast('Failed to update learning domain', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while updating domain', 'error');
    }
  };

  const deleteLearningDomain = async (id) => {
    try {
      const domain = (data.learningDomains || []).find((d) => d.id === id);
      const res = await fetch(`/api/learning/domains/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          learningDomains: (prev.learningDomains || []).filter((d) => d.id !== id),
          learningResources: (prev.learningResources || []).filter((r) => r.domainId !== id)
        }));
        logActivity('Deleted learning domain', domain?.name || id, 'learning');
        addToast('Learning domain and its resources removed', 'info');
      } else {
        addToast('Failed to delete learning domain', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while deleting domain', 'error');
    }
  };

  const addLearningItem = async (item) => {
    try {
      const res = await fetch('/api/learning/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData((prev) => {
          const resources = [resData.resource, ...(prev.learningResources || [])];
          const domains = (prev.learningDomains || []).map((d) => {
            if (d.id === item.domainId) {
              return { ...d, modulesCount: (d.modulesCount || 0) + 1 };
            }
            return d;
          });
          return {
            ...prev,
            learningDomains: domains,
            learningResources: resources
          };
        });
        logActivity('Posted new lesson/resource', item.title, 'learning');
        addToast(`Resource "${item.title}" added to Learning Hub!`, 'success');
      } else {
        addToast('Failed to add learning resource', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while adding resource', 'error');
    }
  };

  const updateLearningItem = async (id, updatedFields) => {
    try {
      const res = await fetch(`/api/learning/resources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData((prev) => ({
          ...prev,
          learningResources: (prev.learningResources || []).map((r) =>
            r.id === id ? resData.resource : r
          )
        }));
        logActivity('Updated learning resource', updatedFields.title || id, 'learning');
        addToast('Learning resource updated', 'success');
      } else {
        addToast('Failed to update learning resource', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while updating resource', 'error');
    }
  };

  const deleteLearningItem = async (id) => {
    try {
      const item = (data.learningResources || []).find((r) => r.id === id);
      const res = await fetch(`/api/learning/resources/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setData((prev) => {
          const resources = (prev.learningResources || []).filter((r) => r.id !== id);
          const domains = (prev.learningDomains || []).map((d) => {
            if (item && d.id === item.domainId) {
              return { ...d, modulesCount: Math.max(0, (d.modulesCount || 1) - 1) };
            }
            return d;
          });
          return {
            ...prev,
            learningDomains: domains,
            learningResources: resources
          };
        });
        logActivity('Removed lesson resource', item?.title || id, 'learning');
        addToast('Learning resource deleted', 'info');
      } else {
        addToast('Failed to delete learning resource', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while deleting resource', 'error');
    }
  };

  const toggleLessonCompleted = (lessonId) => {
    setCompletedLessons((prev) => {
      const exists = prev.includes(lessonId);
      const next = exists ? prev.filter((id) => id !== lessonId) : [...prev, lessonId];
      addToast(
        exists ? 'Marked lesson as uncompleted' : 'Lesson completed! 🎉 Great progress!',
        exists ? 'info' : 'success'
      );
      return next;
    });
  };

  // ==================== MEMBER CRUD ====================
  const addMember = async (member) => {
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData((prev) => ({
          ...prev,
          members: [resData.member, ...prev.members],
          stats: {
            ...prev.stats,
            totalMembers: prev.stats.totalMembers + 1
          }
        }));
        logActivity('Added new member', member.name, 'member');
        addToast(`Member ${member.name} registered successfully!`, 'success');
      } else {
        addToast('Failed to add member', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while adding member', 'error');
    }
  };

  const updateMember = async (id, updatedFields) => {
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData((prev) => ({
          ...prev,
          members: prev.members.map((m) => (m.id === id ? resData.member : m))
        }));
        logActivity('Updated member profile', updatedFields.name || id, 'member');
        addToast('Member profile updated', 'success');
      } else {
        addToast('Failed to update member', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while updating member', 'error');
    }
  };

  const deleteMember = async (id) => {
    try {
      const member = data.members.find((m) => m.id === id);
      const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          members: prev.members.filter((m) => m.id !== id),
          stats: {
            ...prev.stats,
            totalMembers: Math.max(0, prev.stats.totalMembers - 1)
          }
        }));
        logActivity('Removed member', member?.name || id, 'member');
        addToast('Member removed from directory', 'info');
      } else {
        addToast('Failed to delete member', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while deleting member', 'error');
    }
  };

  // ==================== EVENT CRUD ====================
  const addEvent = async (event) => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData((prev) => ({
          ...prev,
          events: [resData.event, ...prev.events],
          stats: {
            ...prev.stats,
            upcomingEvents: prev.stats.upcomingEvents + 1
          }
        }));
        logActivity('Scheduled new event', event.title, 'event');
        addToast(`Event "${event.title}" published!`, 'success');
      } else {
        addToast('Failed to publish event', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while scheduling event', 'error');
    }
  };

  const updateEvent = async (id, updatedFields) => {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData((prev) => ({
          ...prev,
          events: prev.events.map((e) => (e.id === id ? resData.event : e))
        }));
        logActivity('Updated event details', updatedFields.title || id, 'event');
        addToast('Event updated successfully', 'success');
      } else {
        addToast('Failed to update event', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while updating event', 'error');
    }
  };

  const deleteEvent = async (id) => {
    try {
      const event = data.events.find((e) => e.id === id);
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          events: prev.events.filter((e) => e.id !== id),
          stats: {
            ...prev.stats,
            upcomingEvents: Math.max(0, prev.stats.upcomingEvents - 1)
          }
        }));
        logActivity('Deleted event', event?.title || id, 'event');
        addToast('Event deleted', 'info');
      } else {
        addToast('Failed to delete event', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while deleting event', 'error');
    }
  };

  const rsvpToEvent = async (eventId, attendee) => {
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendee)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData((prev) => ({
          ...prev,
          events: prev.events.map((e) => {
            if (e.id === eventId) {
              const attendees = e.attendees || [];
              return {
                ...e,
                rsvps: (e.rsvps || 0) + 1,
                attendees: [...attendees, { name: attendee.name, email: attendee.email, checkedIn: false }]
              };
            }
            return e;
          })
        }));
        addToast(`RSVP confirmed for ${attendee.name}!`, 'success');
      } else {
        addToast('Failed to submit RSVP', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while submitting RSVP', 'error');
    }
  };

  // ==================== CMS & STATIC PAGES ====================
  const updateHeroCMS = async (heroData) => {
    try {
      const updated = { ...data.cmsPages.hero, ...heroData };
      await fetch('/api/cms/pages/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setData((prev) => ({
        ...prev,
        cmsPages: { ...prev.cmsPages, hero: updated }
      }));
      logActivity('Updated Hero Section CMS', 'Landing Page Hero', 'cms');
      addToast('Hero section content saved!', 'success');
    } catch (e) {
      console.error(e);
      addToast('Failed to save Hero section content', 'error');
    }
  };

  const updateAboutCMS = async (aboutData) => {
    try {
      const updated = { ...data.cmsPages.about, ...aboutData };
      await fetch('/api/cms/pages/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setData((prev) => ({
        ...prev,
        cmsPages: { ...prev.cmsPages, about: updated }
      }));
      logActivity('Updated About Section CMS', 'About Club', 'cms');
      addToast('About section content updated!', 'success');
    } catch (e) {
      console.error(e);
      addToast('Failed to save About section content', 'error');
    }
  };

  const updateFAQsCMS = async (faqs) => {
    try {
      await fetch('/api/cms/pages/faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faqs)
      });
      setData((prev) => ({
        ...prev,
        cmsPages: { ...prev.cmsPages, faqs }
      }));
      logActivity('Updated FAQ entries', `${faqs.length} FAQs`, 'cms');
      addToast('FAQs updated successfully!', 'success');
    } catch (e) {
      console.error(e);
      addToast('Failed to save FAQs', 'error');
    }
  };

  const updateFooterCMS = async (footerData) => {
    try {
      const updated = { ...data.cmsPages.footer, ...footerData };
      await fetch('/api/cms/pages/footer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setData((prev) => ({
        ...prev,
        cmsPages: { ...prev.cmsPages, footer: updated }
      }));
      logActivity('Updated Footer Links', 'Footer Links', 'cms');
      addToast('Footer links saved!', 'success');
    } catch (e) {
      console.error(e);
      addToast('Failed to save Footer links', 'error');
    }
  };

  // ==================== ANNOUNCEMENTS ====================
  const addAnnouncement = async (announcement) => {
    try {
      const res = await fetch('/api/cms/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcement)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData((prev) => ({
          ...prev,
          announcements: [resData.announcement, ...prev.announcements]
        }));
        logActivity('Created announcement banner', announcement.title, 'cms');
        addToast('Announcement published to site banner!', 'success');
      } else {
        addToast('Failed to publish announcement', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error while saving announcement', 'error');
    }
  };

  const updateAnnouncement = async (id, updatedFields) => {
    try {
      const res = await fetch(`/api/cms/announcements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData((prev) => ({
          ...prev,
          announcements: prev.announcements.map((a) => (a.id === id ? resData.announcement : a))
        }));
        addToast('Announcement updated!', 'success');
      } else {
        addToast('Failed to update announcement', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error while updating announcement', 'error');
    }
  };

  const toggleAnnouncementActive = async (id) => {
    try {
      const res = await fetch(`/api/cms/announcements/${id}/toggle`, { method: 'PATCH' });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData((prev) => ({
          ...prev,
          announcements: prev.announcements.map((a) => (a.id === id ? resData.announcement : a))
        }));
        addToast('Announcement visibility toggled', 'info');
      } else {
        addToast('Failed to toggle announcement', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error while toggling announcement', 'error');
    }
  };

  const deleteAnnouncement = async (id) => {
    try {
      const res = await fetch(`/api/cms/announcements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          announcements: prev.announcements.filter((a) => a.id !== id)
        }));
        addToast('Announcement removed', 'info');
      } else {
        addToast('Failed to delete announcement', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error while deleting announcement', 'error');
    }
  };

  // ==================== BLOG POSTS ====================
  const addBlogPost = async (post) => {
    try {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData((prev) => ({
          ...prev,
          blogPosts: [resData.post, ...prev.blogPosts]
        }));
        logActivity('Published blog article', post.title, 'cms');
        addToast(`Article "${post.title}" published!`, 'success');
      } else {
        addToast('Failed to publish blog post', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while saving blog post', 'error');
    }
  };

  const updateBlogPost = async (id, updatedFields) => {
    try {
      const res = await fetch(`/api/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData((prev) => ({
          ...prev,
          blogPosts: prev.blogPosts.map((b) => (b.id === id ? resData.post : b))
        }));
        addToast('Article updated', 'success');
      } else {
        addToast('Failed to update blog post', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while updating blog post', 'error');
    }
  };

  const deleteBlogPost = async (id) => {
    try {
      const res = await fetch(`/api/blog/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          blogPosts: prev.blogPosts.filter((b) => b.id !== id)
        }));
        addToast('Article deleted', 'info');
      } else {
        addToast('Failed to delete blog post', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while deleting blog post', 'error');
    }
  };

  // ==================== RESOURCES ====================
  const addResource = async (resObj) => {
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resObj)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData((prev) => ({
          ...prev,
          resources: [resData.resource, ...prev.resources]
        }));
        logActivity('Added resource material', resObj.title, 'cms');
        addToast(`Resource "${resObj.title}" added to Hub!`, 'success');
      } else {
        addToast('Failed to add resource', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while saving resource', 'error');
    }
  };

  const updateResource = async (id, updatedFields) => {
    try {
      const res = await fetch(`/api/resources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData((prev) => ({
          ...prev,
          resources: prev.resources.map((r) => (r.id === id ? resData.resource : r))
        }));
        addToast('Resource updated', 'success');
      } else {
        addToast('Failed to update resource', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while updating resource', 'error');
    }
  };

  const deleteResource = async (id) => {
    try {
      const res = await fetch(`/api/resources/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          resources: prev.resources.filter((r) => r.id !== id)
        }));
        addToast('Resource removed', 'info');
      } else {
        addToast('Failed to delete resource', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while deleting resource', 'error');
    }
  };

  // ==================== PROJECTS SHOWCASE ====================
  const addProject = async (projectObj) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectObj)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData((prev) => ({
          ...prev,
          projects: [resData.project, ...prev.projects],
          stats: {
            ...prev.stats,
            activeProjects: prev.stats.activeProjects + 1
          }
        }));
        logActivity('Featured new AI project', projectObj.name, 'project');
        addToast(`Project "${projectObj.name}" added to showcase!`, 'success');
      } else {
        addToast('Failed to add project', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while saving project', 'error');
    }
  };

  const updateProject = async (id, updatedFields) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData((prev) => ({
          ...prev,
          projects: prev.projects.map((p) => (p.id === id ? resData.project : p))
        }));
        addToast('Project updated', 'success');
      } else {
        addToast('Failed to update project', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while updating project', 'error');
    }
  };

  const deleteProject = async (id) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          projects: prev.projects.filter((p) => p.id !== id),
          stats: {
            ...prev.stats,
            activeProjects: Math.max(0, prev.stats.activeProjects - 1)
          }
        }));
        addToast('Project removed', 'info');
      } else {
        addToast('Failed to delete project', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while deleting project', 'error');
    }
  };

  // ==================== NOTIFICATIONS ====================
  const broadcastNotification = async (notification) => {
    try {
      const toSend = {
        ...notification,
        sentById: currentUser ? currentUser.id : null
      };
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSend)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData((prev) => ({
          ...prev,
          notifications: [resData.notification, ...prev.notifications]
        }));
        logActivity('Broadcasted alert', notification.title, 'notification');
        addToast(`Broadcast sent to ${notification.audience}!`, 'success');
      } else {
        addToast('Failed to broadcast alert', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while broadcasting alert', 'error');
    }
  };

  const deleteNotification = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          notifications: prev.notifications.filter((n) => n.id !== id)
        }));
        addToast('Notification history entry deleted', 'info');
      } else {
        addToast('Failed to delete notification entry', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while deleting notification entry', 'error');
    }
  };

  // ==================== SETTINGS & BRANDING ====================
  const updateBranding = async (brandingUpdates) => {
    try {
      const res = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandingUpdates)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData((prev) => ({
          ...prev,
          branding: resData.branding
        }));
        logActivity('Updated club branding settings', brandingUpdates.clubName || 'Branding', 'settings');
        addToast('Branding settings updated!', 'success');
      } else {
        addToast('Failed to update branding', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while updating branding', 'error');
    }
  };

  const updateSocials = async (socialUpdates) => {
    try {
      const updatedBranding = {
        ...data.branding,
        socials: { ...data.branding.socials, ...socialUpdates }
      };
      const res = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBranding)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData((prev) => ({
          ...prev,
          branding: resData.branding
        }));
        addToast('Social media links saved!', 'success');
      } else {
        addToast('Failed to save social media links', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while saving social links', 'error');
    }
  };

  const resetToDefaults = () => {
    setData(initialClubData);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STUDENT_PROGRESS_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    setCurrentUser(null);
    setCompletedLessons(['lrn-01']);
    addToast('Database restored to default demo state', 'info');
  };

  const exportDatabaseJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `axion_club_data_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Database exported as JSON file', 'success');
  };

  const importDatabaseJSON = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.branding && parsed.members && parsed.events) {
        setData(parsed);
        addToast('Database imported successfully!', 'success');
      } else {
        addToast('Invalid JSON file format', 'error');
      }
    } catch (err) {
      console.error('Error parsing JSON backup file', err);
      addToast('Error parsing JSON backup file', 'error');
    }
  };

  return (
    <ClubContext.Provider
      value={{
        data,
        activeTab,
        setActiveTab,
        isLivePreviewOpen,
        setIsLivePreviewOpen,
        isAdminLoginOpen,
        setIsAdminLoginOpen,
        currentUser,
        isAuthenticated,
        authFetch,
        login,
        registerAdmin,
        logout,
        updateAdminInviteKey,
        updateUserRole,
        toggleUserStatus,
        deleteUserAccount,
        resetUserPassword,
        globalSearch,
        setGlobalSearch,
        toasts,
        addToast,
        removeToast,
        theme,
        toggleTheme,
        // Learning LMS methods
        addLearningDomain,
        updateLearningDomain,
        deleteLearningDomain,
        addLearningItem,
        updateLearningItem,
        deleteLearningItem,
        completedLessons,
        toggleLessonCompleted,
        // Join Requests methods
        submitJoinRequest,
        approveJoinRequest,
        rejectJoinRequest,
        // Member methods
        addMember,
        updateMember,
        deleteMember,
        // Event methods
        addEvent,
        updateEvent,
        deleteEvent,
        rsvpToEvent,
        // CMS methods
        updateHeroCMS,
        updateAboutCMS,
        updateFAQsCMS,
        updateFooterCMS,
        addAnnouncement,
        updateAnnouncement,
        toggleAnnouncementActive,
        deleteAnnouncement,
        addBlogPost,
        updateBlogPost,
        deleteBlogPost,
        addResource,
        updateResource,
        deleteResource,
        // Project methods
        addProject,
        updateProject,
        deleteProject,
        // Notification methods
        broadcastNotification,
        deleteNotification,
        // Settings methods
        updateBranding,
        updateSocials,
        resetToDefaults,
        exportDatabaseJSON,
        importDatabaseJSON
      }}
    >
      {children}
    </ClubContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useClub() {
  const context = useContext(ClubContext);
  if (!context) {
    throw new Error('useClub must be used within a ClubProvider');
  }
  return context;
}
