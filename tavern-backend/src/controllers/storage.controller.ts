// src/controllers/storage.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { storageService } from '../services/storage.service';
import multer from 'multer';

// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

export const uploadQuestReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthenticated' });
    }

    const questId = req.body.questId || req.query.questId;
    const file = req.file;

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

