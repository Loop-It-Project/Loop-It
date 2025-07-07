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
  changePasswordValidation,
  getGeoTrackingSettings,
  updateGeoTrackingSettings,
  updateUserLocation
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

// Neue Geo-Tracking Routes
router.get('/geo-settings', auth, getGeoTrackingSettings);
router.put('/geo-settings', auth, updateGeoTrackingSettings);
router.put('/location', auth, updateUserLocation);

export default router;