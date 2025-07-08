import { useState, useEffect } from 'react';
import UserService from '../services/userService';

// Import der Komponenten
import SettingsLayout from '../components/settings/SettingsLayout';
import ProfileTab from '../components/settings/ProfileTab';
import LocationTab from '../components/settings/LocationTab';
import AppearanceTab from '../components/settings/AppearanceTab';
import SecurityTab from '../components/settings/SecurityTab';

const Settings = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Theme State
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Form States
  const [profileData, setProfileData] = useState({
    displayName: '',
    firstName: '',
    lastName: '',
    bio: '',
    website: '',
    interests: [],
    hobbies: []
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [geoSettings, setGeoSettings] = useState({
    geoTrackingEnabled: false,
    geoTrackingAccuracy: 'city',
    autoUpdateLocation: false,
    showDistanceToOthers: true,
    searchRadius: 50,
    locationVisibility: 'private',
    currentLocation: null
  });

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Theme Effect
  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Load user data
  useEffect(() => {
    loadUserData();
    loadGeoSettings();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      const profileResult = await UserService.getUserProfile();
      if (profileResult.success) {
        const profile = profileResult.data;
        setProfileData({
          displayName: profile.displayName || '',
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          bio: profile.profile?.bio || '',
          website: profile.profile?.website || '',
          interests: profile.profile?.interests || [],
          hobbies: profile.profile?.hobbies || []
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const loadGeoSettings = async () => {
    try {
      const result = await UserService.getGeoTrackingSettings();
      if (result.success) {
        setGeoSettings(prev => ({
          ...prev,
          ...result.data
        }));
      }
    } catch (error) {
      console.error('Error loading geo settings:', error);
    }
  };

  // Theme Toggle
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Handler Functions
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const result = await UserService.updateUserProfile(profileData);
      
      if (result.success) {
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const result = await UserService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      if (result.success) {
        setMessage('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(result.error || 'Failed to change password');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleGeoSettingsSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const result = await UserService.updateGeoTrackingSettings(geoSettings);
      
      if (result.success) {
        setMessage('Location settings updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(result.error || 'Failed to update location settings');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError('');

    try {
      const location = await UserService.getCurrentLocation();
      
      const result = await UserService.updateUserLocation(location);
      
      if (result.success) {
        setGeoSettings(prev => ({
          ...prev,
          currentLocation: {
            lat: location.latitude,
            lng: location.longitude,
            accuracy: location.accuracy,
            lastUpdated: location.timestamp
          }
        }));
        setMessage('Location updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setLocationError(result.error || 'Failed to update location');
      }
    } catch (error) {
      setLocationError(error.message);
    } finally {
      setLocationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-card dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-secondary dark:text-muted mt-4">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <SettingsLayout 
      user={user} 
      onLogout={onLogout}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      error={error}
      message={message}
    >
      {/* Tab Content */}
      {activeTab === 'profile' && (
        <ProfileTab 
          profileData={profileData}
          setProfileData={setProfileData}
          user={user}
          saving={saving}
          onSubmit={handleProfileSubmit}
        />
      )}

      {activeTab === 'location' && (
        <LocationTab 
          geoSettings={geoSettings}
          setGeoSettings={setGeoSettings}
          locationLoading={locationLoading}
          locationError={locationError}
          saving={saving}
          onSubmit={handleGeoSettingsSubmit}
          onGetCurrentLocation={getCurrentLocation}
        />
      )}

      {activeTab === 'appearance' && (
        <AppearanceTab />
      )}

      {activeTab === 'security' && (
        <SecurityTab 
          passwordData={passwordData}
          setPasswordData={setPasswordData}
          saving={saving}
          onSubmit={handlePasswordSubmit}
        />
      )}
    </SettingsLayout>
  );
};

export default Settings;