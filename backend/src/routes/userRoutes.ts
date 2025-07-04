import { Router } from 'express';
import { auth, optionalAuth } from '../middleware/auth';
import {
  getUserProfile,
  getPublicUserProfile,
  getUserSettings,
  updateUserProfile,
  updateUserSettings,
  changePassword,
  updateProfileValidation,
  updateSettingsValidation,
  changePasswordValidation
} from '../controllers/userController';

const router = Router();

// USER PROFILE Routes
router.get('/profile', auth, getUserProfile);                          // Eigenes Profil
router.get('/profile/:username', optionalAuth, getPublicUserProfile); // Öffentliches Profil
router.put('/profile', auth, updateProfileValidation, updateUserProfile);

// USER SETTINGS Routes
router.get('/settings', auth, getUserSettings);
router.put('/settings', auth, updateSettingsValidation, updateUserSettings);

// PASSWORD Routes
router.put('/change-password', auth, changePasswordValidation, changePassword);


export default router;