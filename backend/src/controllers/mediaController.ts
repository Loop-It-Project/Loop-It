import { Request, Response } from 'express';
import { MediaService } from '../services/mediaService';
import path from 'path';
import fs from 'fs';

interface AuthRequest extends Request {
  user?: { id: string; username: string; email: string };
}

// Upload profile image
export const uploadProfileImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const result = await MediaService.uploadProfileImage(req.user.id, req.file);

    res.status(200).json({
      success: true,
      data: result.data,
      message: 'Profile image uploaded successfully'
    });

  } catch (error) {
    console.error('❌ Upload profile image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload profile image'
    });
  }
};

// Upload post images
export const uploadPostImages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({ success: false, error: 'No files uploaded' });
      return;
    }

    const result = await MediaService.uploadPostImages(req.user.id, req.files);

    res.status(200).json({
      success: true,
      data: result.data,
      message: `${result.data.length} images uploaded successfully`
    });

  } catch (error) {
    console.error('❌ Upload post images error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload post images'
    });
  }
};

// Serve media file
export const serveMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename } = req.params;

    if (!filename) {
      res.status(400).json({ success: false, error: 'Filename required' });
      return;
    }

    const result = await MediaService.serveMedia(filename);

    // Validate file path exists
    if (!result.data.filePath) {
      res.status(404).json({ success: false, error: 'File path not found' });
      return;
    }

    // Check if file exists on disk
    if (!fs.existsSync(result.data.filePath)) {
      res.status(404).json({ success: false, error: 'File not found on disk' });
      return;
    }

    // Set appropriate headers
    res.setHeader('Content-Type', result.data.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${result.data.originalName}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache

    // Stream the file
    const fileStream = fs.createReadStream(result.data.filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('❌ Serve media error:', error);
    res.status(404).json({
      success: false,
      error: 'Media not found'
    });
  }
};

// Generate thumbnail
export const serveThumbnail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename } = req.params;

    console.log('🖼️ MediaController: Serving thumbnail:', filename);

    if (!filename) {
      res.status(400).json({ success: false, error: 'Filename required' });
      return;
    }

    // Für Thumbnails verwende das gleiche Bild wie für normale Anzeige
    // In der Zukunft könnten wir spezielle Thumbnails generieren
    const result = await MediaService.serveMedia(filename);

    // Validate file path exists
    if (!result.data.filePath) {
      console.error('❌ MediaController: Thumbnail file path not found for:', filename);
      res.status(404).json({ success: false, error: 'Thumbnail file path not found' });
      return;
    }

    // Check if file exists on disk
    if (!fs.existsSync(result.data.filePath)) {
      console.error('❌ MediaController: Thumbnail file not found on disk:', result.data.filePath);
      res.status(404).json({ success: false, error: 'Thumbnail file not found on disk' });
      return;
    }

    console.log('✅ MediaController: Serving thumbnail file:', result.data.filePath);

    // Set appropriate headers for thumbnail
    res.setHeader('Content-Type', result.data.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="thumb_${result.data.originalName}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache

    // Stream the file
    const fileStream = fs.createReadStream(result.data.filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('❌ Serve thumbnail error:', error);
    res.status(404).json({
      success: false,
      error: 'Thumbnail not found'
    });
  }
};

// Delete media
export const deleteMedia = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { mediaId } = req.params;

    if (!mediaId) {
      res.status(400).json({ success: false, error: 'Media ID required' });
      return;
    }

    const result = await MediaService.deleteMedia(mediaId, req.user.id);

    res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('❌ Delete media error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete media';
    res.status(500).json({
      success: false,
      error: message
    });
  }
};

// Get user media
export const getUserMedia = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await MediaService.getUserMedia(req.user.id, page, limit);

    res.status(200).json({
      success: true,
      data: result.data.media,
      pagination: result.data.pagination
    });

  } catch (error) {
    console.error('❌ Get user media error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user media'
    });
  }
};