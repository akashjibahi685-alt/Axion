const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Provide fallbacks for Railway and other environments where .env is not present
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./dev.db";
process.env.JWT_SECRET = process.env.JWT_SECRET || "fallback_jwt_secret_for_railway_deployments_only";
process.env.ADMIN_KEY_SALT = process.env.ADMIN_KEY_SALT || "axion_fallback_salt";


const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const statsRoutes = require('./routes/stats');
const profileRoutes = require('./routes/profile');
const discussionsRoutes = require('./routes/discussions');
const joinRequestsRoutes = require('./routes/join-requests');
const logsRoutes = require('./routes/logs');
const compilerRoutes = require('./routes/compiler');
const cmsRoutes = require('./routes/cms');
const blogRoutes = require('./routes/blog');
const resourcesRoutes = require('./routes/resources');
const projectsRoutes = require('./routes/projects');
const brandingRoutes = require('./routes/branding');
const eventsRoutes = require('./routes/events');
const learningRoutes = require('./routes/learning');
const notificationsRoutes = require('./routes/notifications');
const { requireAuth } = require('./middleware/authMiddleware');

const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Import Morgan for HTTP request logging
const morgan = require('morgan');

// ── Security Middleware ────────────────────────────────────────────────────────

// HTTP security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Restrict CORS to the Vite frontend origin only
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Global rate limiter: max 200 requests per 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict limiter for auth endpoints: max 15 requests per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many login attempts. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict limiter for compiler: max 20 requests per 15 min per IP
const compilerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many code execution requests. Please wait.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(globalLimiter);
app.use(express.json({ limit: '2mb' }));

// Serve uploads directory statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up detailed API logging
app.use(morgan('dev'));

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/discussions', discussionsRoutes);
app.use('/api/admin/join-requests', joinRequestsRoutes);
app.use('/api/admin/logs', logsRoutes);
app.use('/api/compiler', compilerLimiter, compilerRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/notifications', notificationsRoutes);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

app.get('/api/init', requireAuth, async (req, res) => {
  try {
    const adminUsers = await prisma.user.findMany({ where: { isAdmin: true }, include: { permissions: true } });
    const dbBranding = await prisma.clubBranding.findFirst() || {};
    const branding = {
      id: dbBranding.id || 'axion-branding',
      clubName: dbBranding.clubName || 'AXION',
      fullName: dbBranding.fullName || 'AXION Technical & AI/ML Club',
      tagline: dbBranding.tagline || 'Technical & AI/ML Club — Innovating Beyond Boundaries',
      description: dbBranding.description || '',
      primaryColor: dbBranding.primaryColor || '#0ea5e9',
      secondaryColor: dbBranding.secondaryColor || '#06b6d4',
      accentColor: dbBranding.accentColor || '#f59e0b',
      logoUrl: dbBranding.logoUrl || '/axion_logo.jpg',
      foundedYear: dbBranding.foundedYear || '2023',
      university: dbBranding.university || '',
      contactEmail: dbBranding.contactEmail || '',
      socials: {
        github: dbBranding.githubUrl || '',
        discord: dbBranding.discordUrl || '',
        linkedin: dbBranding.linkedinUrl || '',
        twitter: dbBranding.twitterUrl || '',
        huggingface: dbBranding.huggingfaceUrl || ''
      }
    };
    const notifications = await prisma.notification.findMany({ orderBy: { sentAt: 'desc' } });
    const rawMembers = await prisma.member.findMany({ 
      include: { 
        user: { select: { avatarUrl: true, id: true } },
        skills: true
      },
      orderBy: { joinedDate: 'desc' } 
    });
    const members = rawMembers.map(m => ({
      ...m,
      skills: (m.skills || []).map(s => s.skill)
    }));
    const rawEvents = await prisma.event.findMany({ include: { tags: true, attendees: true }, orderBy: { eventDate: 'desc' } });
    const events = rawEvents.map(e => ({
      ...e,
      date: e.eventDate ? new Date(e.eventDate).toISOString().split('T')[0] : '',
      time: e.eventTime || '',
      tags: (e.tags || []).map(t => t.tag),
      rsvps: (e.attendees || []).length,
      attendees: (e.attendees || []).map(a => ({ name: a.name, email: a.email, checkedIn: a.checkedIn }))
    }));
    const learningDomains = await prisma.learningDomain.findMany({ orderBy: { sortOrder: 'asc' } });
    const learningResources = await prisma.learningResource.findMany();
    const rawProjects = await prisma.project.findMany({ include: { authors: true } });
    const projects = rawProjects.map(p => ({
      ...p,
      image: p.imageUrl || null,
      github: p.githubUrl || null,
      authors: (p.authors || []).map(a => a.authorName || 'Unknown').filter(Boolean)
    }));
    const joinRequests = await prisma.joinRequest.findMany({ orderBy: { submittedAt: 'desc' } });
    const announcements = await prisma.announcement.findMany({ where: { isActive: true } });
    const blogPosts = await prisma.blogPost.findMany({ orderBy: { publishedDate: 'desc' } });
    const resources = await prisma.resource.findMany({ orderBy: { createdAt: 'desc' } });

    // CMS Pages
    const rawCmsPages = await prisma.cmsPage.findMany();
    let cmsPages;
    if (rawCmsPages.length > 0) {
      cmsPages = {};
      rawCmsPages.forEach(page => {
        try {
          cmsPages[page.id] = JSON.parse(page.content);
        } catch(e) {
          console.error('Error parsing CMS page content', e);
        }
      });
    }

    res.json({
      success: true,
      data: {
        adminUsers: adminUsers.map(u => ({ ...u, permissions: u.permissions.map(p => p.permission) })),
        branding,
        members,
        events,
        learningDomains,
        learningResources,
        projects,
        joinRequests,
        announcements,
        blogPosts,
        resources,
        notifications,
        ...(cmsPages && { cmsPages })
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to initialize app data' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Serve frontend built files in production
const frontendDistPath = path.join(__dirname, '../dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  
  // SPA Fallback for frontend routing (must be the last route)
  app.use((req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'AXION Backend API Server is running', status: 'ok', healthCheck: '/api/health' });
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AXION Backend Server running on http://0.0.0.0:${PORT}`);
});
