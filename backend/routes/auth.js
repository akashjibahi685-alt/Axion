const express = require('express');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();
const SALT = process.env.ADMIN_KEY_SALT || 'axion_v1_2026_salt';
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { permissions: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials or account not approved' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials or account not approved' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        avatar: user.avatarUrl,
        permissions: user.permissions.map(p => p.permission),
        token
      }
    });

    // Async update last login
    prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(console.error);
    
    // Activity log
    prisma.activityLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'Signed in',
        type: 'auth'
      }
    }).catch(console.error);

  } catch (error) {
    console.error('Login error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', async (req, res) => {
  const { name, email, password, adminSecretKey, department, role } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Name, email, and password required' });

  try {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    
    // Check if there is already a pending join request
    const existingReq = await prisma.joinRequest.findFirst({
      where: { email: email.toLowerCase().trim(), status: 'Pending' }
    });
    if (existingReq) return res.status(400).json({ error: 'A pending request with this email already exists' });

    let finalRole = 'Member';
    let isAdmin = false;
    let permissionsData = [];
    const passwordHash = await bcrypt.hash(password, 10);

    // If an admin secret is provided, register them immediately as a staff/admin.
    if (adminSecretKey) {
      const tokenRecord = await prisma.adminInviteToken.findFirst({
        where: { isUsed: false }
      });
      
      if (tokenRecord) {
        const inputHash = crypto.createHash('sha256').update(SALT + adminSecretKey + SALT).digest('hex');
        if (inputHash === tokenRecord.tokenHash) {
          finalRole = role || 'Head Administrator';
          isAdmin = true;
          permissionsData = [{ permission: 'ALL' }];
        } else {
           return res.status(401).json({ error: 'Invalid admin secret key' });
        }
      } else {
         return res.status(401).json({ error: 'Invalid admin secret key' });
      }

      // Create admin user directly
      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          role: finalRole,
          title: department ? `${department} Lead` : `${finalRole}`,
          isAdmin,
          permissions: { create: permissionsData }
        },
        include: { permissions: true }
      });

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '24h' });

      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          title: user.title,
          avatar: user.avatarUrl,
          permissions: user.permissions.map(p => p.permission),
          token
        }
      });
    }

    // Otherwise, create a Join Request for the student to be approved by admins
    await prisma.joinRequest.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        department: department || 'General',
        passwordHash,
        status: 'Pending'
      }
    });

    prisma.activityLog.create({
      data: {
        userName: name.trim(),
        action: 'Submitted Join Request',
        type: 'auth'
      }
    }).catch(console.error);

    res.json({
      success: true,
      pending: true,
      message: 'Registration submitted successfully. Please wait for an administrator to approve your account.'
    });

  } catch (error) {
    console.error('Register error', error);
    res.status(500).json({ error: 'Failed to register account' });
  }
});

// Admin override password — requires admin auth
router.post('/admin/users/:userId/password', requireAuth, requireAdmin, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: 'New password required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: { passwordHash }
    });

    // Log the override action
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'Admin Overrode Password',
        type: 'auth'
      }
    });

    res.json({ success: true, message: 'Password overridden successfully' });
  } catch (error) {
    console.error('Password override error', error);
    res.status(500).json({ error: 'Failed to override password' });
  }
});

// Admin change user role — requires admin auth
router.put('/admin/users/:userId/role', requireAuth, requireAdmin, async (req, res) => {
  const { newRole } = req.body;
  if (!newRole) return res.status(400).json({ error: 'New role required' });

  try {
    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: { role: newRole },
      include: { permissions: true }
    });

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: `Role updated to ${newRole}`,
        type: 'admin'
      }
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        avatar: user.avatarUrl,
        permissions: user.permissions.map(p => p.permission),
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Role update error', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Admin toggle user status (Suspend/Activate) — requires admin auth
router.put('/admin/users/:userId/status', requireAuth, requireAdmin, async (req, res) => {
  const { isActive } = req.body;
  if (isActive === undefined) return res.status(400).json({ error: 'isActive status required' });

  try {
    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: { isActive },
      include: { permissions: true }
    });

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: `Account ${isActive ? 'Activated' : 'Suspended'}`,
        type: 'admin'
      }
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        avatar: user.avatarUrl,
        permissions: user.permissions.map(p => p.permission),
        isAdmin: user.isAdmin,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Status update error', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Admin delete user account — requires admin auth
router.delete('/admin/users/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.user.id === req.params.userId) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Ensure they aren't deleting themselves or the only head admin
    // (A more robust check could be added here later)

    await prisma.user.delete({
      where: { id: req.params.userId }
    });

    res.json({ success: true, message: 'User account deleted successfully' });
  } catch (error) {
    console.error('User deletion error', error);
    res.status(500).json({ error: 'Failed to delete user account' });
  }
});

// Update Admin Verification Key — requires admin auth
router.post('/admin/invite-token', requireAuth, requireAdmin, async (req, res) => {
  const { newKey } = req.body;
  if (!newKey) return res.status(400).json({ error: 'New key required' });

  try {
    const inputHash = crypto.createHash('sha256').update(SALT + newKey + SALT).digest('hex');
    
    // Invalidate old tokens
    await prisma.adminInviteToken.updateMany({
      where: { isUsed: false },
      data: { isUsed: true }
    });

    await prisma.adminInviteToken.create({
      data: {
        tokenHash: inputHash,
        role: 'Admin',
        permissions: 'ALL',
        expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
        isUsed: false
      }
    });

    res.json({ success: true, message: 'Admin verification key updated successfully' });
  } catch (error) {
    console.error('Invite token update error', error);
    res.status(500).json({ error: 'Failed to update invite token' });
  }
});

module.exports = router;
