import { db } from '../db/connection';
import { mediaTable, usersTable } from '../db/Schemas';
import { eq, desc, sql, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { processImage } from '../middleware/upload';

export class MediaService {
  
  // Upload profile image
  static async uploadProfileImage(userId: string, file: Express.Multer.File) {
    try {
      console.log('📸 Processing profile image upload:', {
        userId,
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });

      // Process image (resize and compress)
      const processedPath = await processImage(file.path, {
        width: 400,
        height: 400,
        quality: 85,
        format: 'jpeg'
      });

      console.log('📸 MediaService: Image processed:', {
        originalPath: file.path,
        processedPath,
        exists: fs.existsSync(processedPath)
      });

      // Calculate file stats
      const stats = fs.statSync(processedPath);
      const fileSize = stats.size;

      // Generate URLs
      const baseUrl = process.env.API_URL || 'http://localhost:3000';
      const url = `${baseUrl}/api/media/serve/${path.basename(processedPath)}`;
      const thumbnailUrl = `${baseUrl}/api/media/thumbnail/${path.basename(processedPath)}`;

      console.log('📸 MediaService: Generated URLs:', {
        baseUrl,
        filename: path.basename(processedPath),
        url,
        thumbnailUrl
      });

      // Save to database
      const mediaId = uuidv4();
      const mediaData = {
        id: mediaId,
        uploaderId: userId,
        originalName: file.originalname,
        filename: path.basename(processedPath),
        mimeType: 'image/jpeg',
        fileSize,
        url,
        thumbnailUrl,
        dimensions: { width: 400, height: 400 },
        processingStatus: 'completed',
        processingProgress: 100,
        storageProvider: 'local',
        storagePath: processedPath,
        isPublic: true,
        moderationStatus: 'approved'
      };

      console.log('📸 MediaService: Saving to database:', mediaData);

      const mediaRecord = await db
        .insert(mediaTable)
        .values(mediaData)
        .returning();

      console.log('📸 MediaService: Database record created:', mediaRecord);

      // Update user profile with avatar
      await db
        .update(usersTable)
        .set({
          updatedAt: new Date()
        })
        .where(eq(usersTable.id, userId));

      // Cleanup nur original file, nicht processed file
      if (file.path !== processedPath) {
        try {
          fs.unlinkSync(file.path);
          console.log('🗑️ Cleaned up original temp file:', file.path);
        } catch (cleanupError) {
          console.warn('⚠️ Could not cleanup original file:', file.path);
        }
      }

      console.log('✅ Profile image uploaded successfully:', mediaId);

      return {
        success: true,
        data: {
          id: mediaId,
          url,
          thumbnailUrl,
          filename: path.basename(processedPath)
        }
      };

    } catch (error) {
      console.error('❌ Profile image upload error:', error);
      
      // Cleanup files on error
      if (file.path) {
        try {
          fs.unlinkSync(file.path);
          console.log('🗑️ Cleaned up file on error:', file.path);
        } catch (cleanupError) {
          console.warn('⚠️ Could not cleanup file on error:', file.path);
        }
      }
      
      throw error;
    }
  }

  // Upload post images
  static async uploadPostImages(userId: string, files: Express.Multer.File[]) {
    try {
      console.log('📸 MediaService: Processing post images upload:', {
        userId,
        fileCount: files.length,
        files: files.map(f => ({ 
          filename: f.filename, 
          originalname: f.originalname, 
          size: f.size,
          path: f.path,
          mimetype: f.mimetype
        }))
      });

      const uploadedMedia = [];
      const tempFilesToCleanup = [];

      for (const file of files) {
        try {
          console.log('📸 MediaService: Processing individual file:', {
            filename: file.filename,
            originalname: file.originalname,
            path: file.path,
            exists: fs.existsSync(file.path)
          });

          // Process image
          const processedPath = await processImage(file.path, {
            maxWidth: 1920,      // ← Maximal-Breite statt feste Breite
            maxHeight: 1080,     // ← Maximal-Höhe statt feste Höhe
            quality: 90,         // ← Höhere Qualität
            format: 'jpeg',
            preserveAspectRatio: true  // ← Seitenverhältnis beibehalten
          });

          console.log('📸 MediaService: Image processed:', {
            originalPath: file.path,
            processedPath,
            processedExists: fs.existsSync(processedPath)
          });

          // Nur original file für cleanup vormerken
          tempFilesToCleanup.push(file.path);

          // File stats
          const stats = fs.statSync(processedPath);
          const fileSize = stats.size;

          // Originale Dimensionen aus verarbeitetem Bild lesen
          const imageMetadata = await sharp(processedPath).metadata();
          const dimensions = {
            width: imageMetadata.width,
            height: imageMetadata.height,
            aspectRatio: imageMetadata.width && imageMetadata.height 
              ? (imageMetadata.width / imageMetadata.height).toFixed(2)
              : null
          };

          // Generate URLs
          const baseUrl = process.env.API_URL || 'http://localhost:3000';
          const url = `${baseUrl}/api/media/serve/${path.basename(processedPath)}`;
          const thumbnailUrl = `${baseUrl}/api/media/thumbnail/${path.basename(processedPath)}`;

          console.log('📸 MediaService: Generated URLs for file:', {
            filename: path.basename(processedPath),
            url,
            thumbnailUrl
          });

          // Save to database
          const mediaId = uuidv4();
          const mediaData = {
            id: mediaId,
            uploaderId: userId,
            originalName: file.originalname,
            filename: path.basename(processedPath),
            mimeType: 'image/jpeg',
            fileSize,
            url,
            thumbnailUrl,
            dimensions,
            processingStatus: 'completed',
            processingProgress: 100,
            storageProvider: 'local',
            storagePath: processedPath,
            isPublic: true,
            moderationStatus: 'approved'
          };

          console.log('📸 MediaService: Saving media to database:', mediaData);

          const mediaRecord = await db
            .insert(mediaTable)
            .values(mediaData)
            .returning();

          console.log('📸 MediaService: Database record created:', mediaRecord);

          uploadedMedia.push({
            id: mediaId,
            url,
            thumbnailUrl,
            filename: path.basename(processedPath),
            originalName: file.originalname,
            dimensions
          });

        } catch (error) {
          console.error(`❌ Error processing file ${file.filename}:`, error);
          // Continue with other files
        }
      }

      // Cleanup nur original files, nicht processed files
      tempFilesToCleanup.forEach(filePath => {
        try {
          fs.unlinkSync(filePath);
          console.log('🗑️ Cleaned up temp file:', filePath);
        } catch (cleanupError) {
          console.warn('⚠️ Could not cleanup temp file:', filePath);
        }
      });

      console.log('✅ Post images uploaded successfully:', uploadedMedia.length);

      return {
        success: true,
        data: uploadedMedia
      };

    } catch (error) {
      console.error('❌ Post images upload error:', error);
      
      // Cleanup files on error
      files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
          console.log('🗑️ Cleaned up file on error:', file.path);
        } catch (cleanupError) {
          console.warn('⚠️ Could not cleanup file on error:', file.path);
        }
      });
      
      throw error;
    }
  }

  // Serve media file
  static async serveMedia(filename: string) {
    try {
      console.log('📸 MediaService: Serving media file:', filename);
      
      // Get media record from database
      const media = await db
        .select()
        .from(mediaTable)
        .where(eq(mediaTable.filename, filename))
        .limit(1);

      console.log('📸 MediaService: Database query result:', {
        filename,
        foundRecords: media.length,
        record: media[0] || null
      });

      if (media.length === 0) {
        console.error('❌ MediaService: Media not found in database:', filename);
        
        // ✅ DEBUGGING: Schaue was in der Datenbank ist
        const allMedia = await db
          .select({
            id: mediaTable.id,
            filename: mediaTable.filename,
            originalName: mediaTable.originalName,
            storagePath: mediaTable.storagePath
          })
          .from(mediaTable)
          .limit(10);
        
        console.log('📸 MediaService: All media in database (first 10):', allMedia);
        
        throw new Error('Media not found');
      }

      const mediaRecord = media[0];
      console.log('✅ MediaService: Media record found:', {
        id: mediaRecord.id,
        filename: mediaRecord.filename,
        originalName: mediaRecord.originalName,
        storagePath: mediaRecord.storagePath,
        url: mediaRecord.url,
        thumbnailUrl: mediaRecord.thumbnailUrl
      });

      // Check if file exists
      if (!mediaRecord.storagePath) {
        console.error('❌ MediaService: Storage path not found for:', filename);
        throw new Error('Storage path not found');
      }

      const fileExists = fs.existsSync(mediaRecord.storagePath);
      console.log('📸 MediaService: File system check:', {
        storagePath: mediaRecord.storagePath,
        exists: fileExists,
        isAbsolute: path.isAbsolute(mediaRecord.storagePath)
      });

      if (!fileExists) {
        console.error('❌ MediaService: File not found on disk:', mediaRecord.storagePath);
        
        // ✅ DEBUGGING: Schaue was im uploads-Ordner ist
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const postsDir = path.join(uploadsDir, 'posts');
        
        try {
          const uploadsExists = fs.existsSync(uploadsDir);
          const postsExists = fs.existsSync(postsDir);
          
          console.log('📁 MediaService: Directory check:', {
            uploadsDir,
            uploadsExists,
            postsDir,
            postsExists
          });
          
          if (postsExists) {
            const postsFiles = fs.readdirSync(postsDir);
            console.log('📁 MediaService: Files in posts directory:', postsFiles);
          }
        } catch (dirError) {
          console.error('❌ MediaService: Error checking directories:', dirError);
        }
        
        throw new Error('File not found on disk');
      }

      // Update view count
      await db
        .update(mediaTable)
        .set({
          viewCount: sql`${mediaTable.viewCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(mediaTable.id, mediaRecord.id));

      console.log('✅ MediaService: Media file ready to serve:', mediaRecord.storagePath);

      return {
        success: true,
        data: {
          filePath: mediaRecord.storagePath,
          mimeType: mediaRecord.mimeType,
          originalName: mediaRecord.originalName
        }
      };

    } catch (error) {
      console.error('❌ MediaService: Serve media error:', error);
      throw error;
    }
  }

  // Delete media
  static async deleteMedia(mediaId: string, userId: string) {
    try {
      console.log('🗑️ MediaService: Deleting media:', { mediaId, userId });
      
      // Get media record
      const media = await db
        .select()
        .from(mediaTable)
        .where(eq(mediaTable.id, mediaId))
        .limit(1);

      if (media.length === 0) {
        console.error('❌ MediaService: Media not found for deletion:', mediaId);
        throw new Error('Media not found');
      }

      const mediaRecord = media[0];
      console.log('📸 MediaService: Media record for deletion:', {
        id: mediaRecord.id,
        filename: mediaRecord.filename,
        uploaderId: mediaRecord.uploaderId,
        storagePath: mediaRecord.storagePath
      });

      // Check if user owns the media
      if (mediaRecord.uploaderId !== userId) {
        console.error('❌ MediaService: User not authorized to delete media:', {
          mediaUploaderId: mediaRecord.uploaderId,
          requestUserId: userId
        });
        throw new Error('Not authorized to delete this media');
      }

      // Delete file from disk
      if (mediaRecord.storagePath && fs.existsSync(mediaRecord.storagePath)) {
        fs.unlinkSync(mediaRecord.storagePath);
        console.log('🗑️ MediaService: File deleted from disk:', mediaRecord.storagePath);
      } else {
        console.log('⚠️ MediaService: Storage path not found or file does not exist:', mediaRecord.storagePath);
      }

      // Delete from database
      await db
        .delete(mediaTable)
        .where(eq(mediaTable.id, mediaId));

      console.log('✅ MediaService: Media deleted successfully:', mediaId);

      return {
        success: true,
        message: 'Media deleted successfully'
      };

    } catch (error) {
      console.error('❌ MediaService: Delete media error:', error);
      throw error;
    }
  }

  // Get user media
  static async getUserMedia(userId: string, page: number = 1, limit: number = 20) {
    try {
      console.log('📋 MediaService: Getting user media:', { userId, page, limit });
      
      const offset = (page - 1) * limit;

      const media = await db
        .select({
          id: mediaTable.id,
          originalName: mediaTable.originalName,
          filename: mediaTable.filename,
          mimeType: mediaTable.mimeType,
          fileSize: mediaTable.fileSize,
          url: mediaTable.url,
          thumbnailUrl: mediaTable.thumbnailUrl,
          dimensions: mediaTable.dimensions,
          viewCount: mediaTable.viewCount,
          createdAt: mediaTable.createdAt,
          storagePath: mediaTable.storagePath // ✅ DEBUGGING: Auch storagePath zurückgeben
        })
        .from(mediaTable)
        .where(eq(mediaTable.uploaderId, userId))
        .orderBy(desc(mediaTable.createdAt))
        .offset(offset)
        .limit(limit);

      console.log('📋 MediaService: User media retrieved:', {
        userId,
        foundCount: media.length,
        media: media.map(m => ({
          id: m.id,
          filename: m.filename,
          url: m.url,
          thumbnailUrl: m.thumbnailUrl,
          storagePath: m.storagePath,
          fileExists: m.storagePath ? fs.existsSync(m.storagePath) : false
        }))
      });

      return {
        success: true,
        data: {
          media,
          pagination: {
            page,
            limit,
            hasMore: media.length === limit
          }
        }
      };

    } catch (error) {
      console.error('❌ MediaService: Get user media error:', error);
      throw error;
    }
  }
}