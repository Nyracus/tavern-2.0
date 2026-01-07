// src/controllers/storage.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { storageService } from '../services/storage.service';

// Try to import multer - if not installed, file uploads will be disabled
let multer: any;
let upload: any;

try {
  multer = require('multer');
  // Configure multer for file upload (memory storage)
  upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req: any, file: any, cb: any) => {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'));
      }
    },
  });
} catch (error) {
  console.warn('⚠️  multer not installed - file uploads disabled. Run: npm install multer @types/multer');
  // Create a stub middleware that returns an error
  upload = {
    single: () => (req: any, res: any, next: any) => {
      return res.status(503).json({
        success: false,
        message: 'File upload feature is not available. Please install multer package.',
      });
    },
  };
}

export const uploadQuestReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!multer) {
      return res.status(503).json({
        success: false,
        message: 'File upload feature is not available. Please install multer package.',
      });
    }

    if (!req.userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthenticated' });
    }

    const questId = req.body.questId || req.query.questId;
    const file = (req as any).file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    if (!questId) {
      return res.status(400).json({
        success: false,
        message: 'Quest ID is required',
      });
    }

    // Upload to Supabase
    const publicUrl = await storageService.uploadQuestReport(
      file.buffer,
      req.userId,
      String(questId),
      file.originalname
    );

    return res.json({
      success: true,
      url: publicUrl,
      filename: file.originalname,
    });
  } catch (err) {
    next(err);
  }
};

// Export multer middleware for use in routes
export const uploadMiddleware = upload.single('file');

