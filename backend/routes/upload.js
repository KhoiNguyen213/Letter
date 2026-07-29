import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireOwner } from '../middleware/auth.js';
import { saveFile } from '../utils/storage.js';

const router = express.Router();


// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Endpoint for files (owner authenticated)
router.post('/', requireOwner, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const { title, artist, duration } = req.body;
    const fileUrl = await saveFile(req.file);

    return res.json({
      url: fileUrl,
      fileSize: req.file.size,
      title: title || req.file.originalname,
      artist: artist || '',
      duration: duration ? parseFloat(duration) : undefined,
    });
  } catch (error) {
    console.error('File storage upload failed:', error);
    return res.status(500).json({ 
      message: 'Failed to store file', 
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
});

export default router;
