import { Router } from 'express';
import { auth, optionalAuth } from '../middleware/auth';
import {
  getUserProfile,
  getPublicUserProfile,
  getUserSettings,
  updateProfile,
  updateUserSettings,
  changePassword,
  updateProfileValidation,
  updateSettingsValidation,
  changePasswordValidation,
  getGeoTrackingSettings,
  updateGeoTrackingSettings,
  updateUserLocation,
  getUserPosts,
  getUserStats,
  getFriendsWithCommonInterests,
} from '../controllers/userController';

const router = Router();

// USER PROFILE Routes
router.get('/profile', auth, getUserProfile);                          // Eigenes Profil
router.get('/profile/:username', optionalAuth, getPublicUserProfile); // Öffentliches Profil
router.put('/profile', auth, updateProfileValidation, updateProfile);
router.get('/profile/:username/posts', getUserPosts);                    // User's Posts
router.get('/profile/:username/stats', getUserStats);                   // User's Statistiken
router.get('/friends/common-interests', auth, getFriendsWithCommonInterests); // Gemeinsame Interessen

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