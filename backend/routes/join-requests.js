const express = require('express');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Get all join requests — requires admin auth
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const requests = await prisma.joinRequest.findMany({
      orderBy: { submittedAt: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch join requests' });
  }
});

// Approve a join request — requires admin auth
router.post('/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: req.params.id }
    });

    if (!joinRequest) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    if (joinRequest.status !== 'Pending') {
      return res.status(400).json({ error: 'Request is already processed' });
    }

    // Check if user email already exists
    const existing = await prisma.user.findUnique({
      where: { email: joinRequest.email }
    });

    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create the User and Member in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: joinRequest.name,
          email: joinRequest.email,
          passwordHash: joinRequest.passwordHash || '', // fallback
          role: 'Member',
          title: joinRequest.department ? `${joinRequest.department} Member` : 'Member',
          isAdmin: false
        }
      });

      const member = await tx.member.create({
        data: {
          id: 'mem-' + crypto.randomUUID(),
          userId: user.id,
          name: user.name,
          email: user.email,
          role: 'Member',
          status: 'Active',
          department: joinRequest.department || 'General'
        }
      });

      const updatedRequest = await tx.joinRequest.update({
        where: { id: joinRequest.id },
        data: { status: 'Approved', reviewedAt: new Date() }
      });

      return { user, member, updatedRequest };
    });

    res.json({ success: true, user: result.user, member: result.member });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: 'Failed to approve join request' });
  }
});

// Reject a join request — requires admin auth
router.post('/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const updatedRequest = await prisma.joinRequest.update({
      where: { id: req.params.id },
      data: { status: 'Rejected', reviewedAt: new Date() }
    });
    res.json({ success: true, request: updatedRequest });
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({ error: 'Failed to reject join request' });
  }
});

module.exports = router;
