// src/services/storage.service.ts
import { supabase } from '../config/supabase.config';
import { AppError } from '../middleware/error.middleware';

export class StorageService {
  /**
   * Upload a PDF file to Supabase Storage
   * @param fileBuffer Buffer from multer
   * @param userId User ID for folder organization
   * @param questId Quest ID for folder organization
   * @param filename Original filename
   * @returns Public URL of uploaded file
   */
  async uploadQuestReport(
    fileBuffer: Buffer,
    userId: string,
    questId: string,
    filename: string
  ): Promise<string> {
    try {
      // Check if Supabase is configured
      if (!supabase) {
        throw new AppError(503, 'File storage is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in environment variables.');
      }

      // Validate file type
      if (!filename.toLowerCase().endsWith('.pdf')) {
        throw new AppError(400, 'Only PDF files are allowed');
      }

      // Create unique filename: questId_userId_timestamp.pdf
      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFilename = `${questId}_${userId}_${timestamp}_${sanitizedFilename}`;

      // Upload to Supabase Storage bucket: quest-reports
      const bucketName = 'quest-reports';
      const filePath = `${userId}/${uniqueFilename}`;

      // Upload file (Supabase accepts Buffer, Uint8Array, or Blob)
      const { data, error } = await supabase!.storage
        .from(bucketName)
        .upload(filePath, fileBuffer, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new AppError(500, `Failed to upload file: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase!.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new AppError(500, 'Failed to get public URL for uploaded file');
      }

      return urlData.publicUrl;
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(500, 'File upload failed');
    }
  }

  /**
   * Delete a file from Supabase Storage
   */
  async deleteQuestReport(filePath: string): Promise<void> {
    try {
      if (!supabase) {
        throw new AppError(503, 'File storage is not configured.');
      }

      const bucketName = 'quest-reports';
      // Extract path from full URL if needed
      const path = filePath.includes(bucketName)
        ? filePath.split(bucketName + '/')[1]
        : filePath;

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([path]);

      if (error) {
        console.error('Supabase delete error:', error);
        throw new AppError(500, `Failed to delete file: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(500, 'File deletion failed');
    }
  }
}

export const storageService = new StorageService();

