const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const router = express.Router();
const prisma = new PrismaClient();

// Get all activity logs for admin auditing — requires admin auth
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500, // Limit to 500 most recent for performance
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      }
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

module.exports = router;
