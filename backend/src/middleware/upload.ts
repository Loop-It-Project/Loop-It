import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

// Supported file types
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
];

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  profileImage: 5 * 1024 * 1024, // 5MB for profile images
  postImage: 10 * 1024 * 1024,   // 10MB for post images
};

// Create upload directories if they don't exist
const createUploadDirectories = () => {
  const directories = [
    'uploads',
    'uploads/profiles',
    'uploads/posts',
    'uploads/temp'
  ];

  directories.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ Created directory: ${fullPath}`);
    }
  });
};

// Initialize directories
createUploadDirectories();

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
  console.log('📄 File filter check:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  // Check if file type is supported
  if (!SUPPORTED_IMAGE_TYPES.includes(file.mimetype)) {
    console.log('❌ Unsupported file type:', file.mimetype);
    return callback(new Error(`Unsupported file type: ${file.mimetype}. Supported types: ${SUPPORTED_IMAGE_TYPES.join(', ')}`));
  }

  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(fileExtension)) {
    console.log('❌ Unsupported file extension:', fileExtension);
    return callback(new Error(`Unsupported file extension: ${fileExtension}`));
  }

  console.log('✅ File passed filter checks');
  callback(null, true);
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    let uploadPath = 'uploads/temp';
    
    // Determine upload path based on field name
    if (file.fieldname === 'profileImage') {
      uploadPath = 'uploads/profiles';
    } else if (file.fieldname === 'postImages') {
      uploadPath = 'uploads/posts';
    }

    console.log('📁 Upload destination:', uploadPath);
    callback(null, uploadPath);
  },
  
  filename: (req, file, callback) => {
    // Generate unique filename
    const uniqueId = uuidv4();
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const filename = `${uniqueId}${fileExtension}`;
    
    console.log('📝 Generated filename:', filename);
    callback(null, filename);
  }
});

// Profile image upload middleware
export const uploadProfileImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.profileImage,
    files: 1
  }
}).single('profileImage'); // ← Stimmt mit Frontend überein

// Post images upload middleware (multiple files)
export const uploadPostImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.postImage,
    files: 5 // Maximum 5 images per post
  }
}).array('postImages', 5); // ← Stimmt mit Frontend überein

// Single post image upload
export const uploadSinglePostImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.postImage,
    files: 1
  }
}).single('postImage');

// Error handling middleware for multer
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  console.error('❌ Upload error:', error);

  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: 'File size too large',
          details: 'Maximum file size is 10MB for post images and 5MB for profile images'
        });
      
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too many files',
          details: 'Maximum 5 files per post'
        });
      
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: 'Unexpected file field',
          details: 'Invalid file field name'
        });
      
      default:
        return res.status(400).json({
          success: false,
          error: 'File upload error',
          details: error.message
        });
    }
  }

  // Custom file filter errors
  if (error.message.includes('Unsupported file type') || error.message.includes('Unsupported file extension')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      details: error.message
    });
  }

  // Generic error
  return res.status(500).json({
    success: false,
    error: 'Upload failed',
    details: error.message
  });
};

// Image processing utilities
export const processImage = async (filePath: string, options: {
  width?: number;
  height?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  preserveAspectRatio?: boolean;
}) => {
  try {
    const { 
      width, 
      height, 
      maxWidth, 
      maxHeight, 
      quality = 80, 
      format = 'jpeg',
      preserveAspectRatio = false
    } = options;
    
    let processor = sharp(filePath);
    
    // Flexible Größenänderung
    if (preserveAspectRatio && (maxWidth || maxHeight)) {
      // Skalieren mit Maximal-Dimensionen (behält Seitenverhältnis)
      processor = processor.resize(maxWidth, maxHeight, {
        fit: 'inside',           // ← Skaliert INNERHALB der Grenzen
        withoutEnlargement: true // ← Vergrößert nicht über Original hinaus
      });
    } else if (width || height) {
      // Feste Dimensionen (bisheriges Verhalten)
      processor = processor.resize(width, height, {
        fit: 'cover',
        position: 'center'
      });
    }
    
    // Convert format and compress
    if (format === 'jpeg') {
      processor = processor.jpeg({ quality });
    } else if (format === 'png') {
      processor = processor.png({ quality });
    } else if (format === 'webp') {
      processor = processor.webp({ quality });
    }
    
    // Generate processed file path
    const parsedPath = path.parse(filePath);
    const processedPath = path.join(parsedPath.dir, `${parsedPath.name}_processed${parsedPath.ext}`);
    
    await processor.toFile(processedPath);
    
    return processedPath;
  } catch (error) {
    console.error('❌ Image processing error:', error);
    throw error;
  }
};

// Cleanup temp files
export const cleanupTempFiles = (filePaths: string[]) => {
  filePaths.forEach(filePath => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Cleaned up temp file: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error cleaning up file ${filePath}:`, error);
    }
  });
};