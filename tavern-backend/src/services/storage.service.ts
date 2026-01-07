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

  /**
   * Upload a logo image to Supabase Storage
   * @param fileBuffer Buffer from multer
   * @param userId User ID for folder organization
   * @param type 'adventurer' or 'npc'
   * @param filename Original filename
   * @returns Public URL of uploaded file
   */
  async uploadLogo(
    fileBuffer: Buffer,
    userId: string,
    type: 'adventurer' | 'npc',
    filename: string
  ): Promise<string> {
    try {
      // Check if Supabase is configured
      if (!supabase) {
        throw new AppError(503, 'File storage is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in environment variables.');
      }

      // Validate file type (images only)
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const fileExtension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
      if (!allowedExtensions.includes(fileExtension)) {
        throw new AppError(400, 'Only image files are allowed (jpg, jpeg, png, gif, webp, svg)');
      }

      // Create unique filename: userId_timestamp.ext
      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFilename = `${userId}_${timestamp}${fileExtension}`;

      // Upload to Supabase Storage bucket: logos
      const bucketName = 'logos';
      const filePath = `${type}/${uniqueFilename}`;

      // Determine content type
      const contentTypeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
      };
      const contentType = contentTypeMap[fileExtension] || 'image/png';

      // Upload file (Supabase accepts Buffer, Uint8Array, or Blob)
      const { data, error } = await supabase!.storage
        .from(bucketName)
        .upload(filePath, fileBuffer, {
          contentType,
          upsert: true, // Allow overwriting if same user uploads again
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new AppError(500, `Failed to upload logo: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase!.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new AppError(500, 'Failed to get public URL for uploaded logo');
      }

      return urlData.publicUrl;
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(500, 'Logo upload failed');
    }
  }

  /**
   * Delete a logo from Supabase Storage
   */
  async deleteLogo(logoUrl: string): Promise<void> {
    try {
      if (!supabase) {
        throw new AppError(503, 'File storage is not configured.');
      }

      const bucketName = 'logos';
      // Extract path from full URL if needed
      const path = logoUrl.includes(bucketName)
        ? logoUrl.split(bucketName + '/')[1]?.split('?')[0] // Remove query params
        : logoUrl;

      const { error } = await supabase!.storage
        .from(bucketName)
        .remove([path]);

      if (error) {
        console.error('Supabase delete error:', error);
        // Don't throw error if file doesn't exist (already deleted)
        if (error.message && !error.message.includes('not found')) {
          throw new AppError(500, `Failed to delete logo: ${error.message}`);
        }
      }
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      // Silently fail deletion - not critical
      console.warn('Logo deletion failed:', err);
    }
  }
}

export const storageService = new StorageService();

