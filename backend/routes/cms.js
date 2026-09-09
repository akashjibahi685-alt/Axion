const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');

// Configure multer storage for CMS uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cms-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Upload a CMS asset (image, etc.)
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload file' });
  }
});

// Add new announcement
router.post('/announcements', async (req, res) => {
  try {
    const { title, content, urgency } = req.body;
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        urgency: urgency || 'Normal',
        isActive: true,
      }
    });
    res.json({ success: true, announcement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ success: false, error: 'Failed to create announcement' });
  }
});

// Update announcement
router.put('/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, urgency } = req.body;
    
    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title,
        content,
        urgency: urgency || 'Normal',
      }
    });
    res.json({ success: true, announcement: updated });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ success: false, error: 'Failed to update announcement' });
  }
});

// Toggle announcement visibility
router.patch('/announcements/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }
    
    const updated = await prisma.announcement.update({
      where: { id },
      data: { isActive: !announcement.isActive }
    });
    res.json({ success: true, announcement: updated });
  } catch (error) {
    console.error('Error toggling announcement:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle announcement' });
  }
});

// Delete announcement
router.delete('/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.announcement.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ success: false, error: 'Failed to delete announcement' });
  }
});

// Update CMS Page Content
router.put('/pages/:id', async (req, res) => {
  try {
    const { id } = req.params; // 'hero', 'about', 'faqs', 'footer'
    const contentData = req.body; // JSON object representing the page content
    
    const updatedPage = await prisma.cmsPage.upsert({
      where: { id },
      update: {
        content: JSON.stringify(contentData)
      },
      create: {
        id,
        content: JSON.stringify(contentData)
      }
    });
    
    res.json({ success: true, page: updatedPage });
  } catch (error) {
    console.error(`Error updating CMS page ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Failed to update CMS page' });
  }
});

module.exports = router;
