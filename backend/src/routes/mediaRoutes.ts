import { Router } from 'express';
import { 
  uploadProfileImage, 
  uploadPostImages, 
  serveMedia, 
  serveThumbnail, 
  deleteMedia, 
  getUserMedia 
} from '../controllers/mediaController';
import { auth } from '../middleware/auth';
import { 
  uploadProfileImage as uploadProfileImageMiddleware, 
  uploadPostImages as uploadPostImagesMiddleware, 
  handleUploadError 
} from '../middleware/upload';

const router = Router();

// Upload routes
router.post('/upload/profile', auth, uploadProfileImageMiddleware, handleUploadError, uploadProfileImage);
router.post('/upload/post', auth, uploadPostImagesMiddleware, handleUploadError, uploadPostImages);

// Serve routes
router.get('/serve/:filename', serveMedia);
router.get('/thumbnail/:filename', serveThumbnail);

// Management routes
router.get('/my-media', auth, getUserMedia);
router.delete('/:mediaId', auth, deleteMedia);

export default router;