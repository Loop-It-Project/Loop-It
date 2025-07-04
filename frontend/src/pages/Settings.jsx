import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ Navigation Hook hinzufügen
import { ArrowLeft } from 'lucide-react'; // ✅ Back Icon hinzufügen
import UserService from '../services/userService';

const Settings = ({ user, onLogout }) => {
  const navigate = useNavigate(); // ✅ Navigation Hook verwenden
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Theme State (lokaler State statt Context)
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

  const [activeTab, setActiveTab] = useState('profile');

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
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load profile
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

  // Theme Toggle Function
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Simple Theme Toggle Component
  const ThemeToggle = ({ showLabel = true }) => {
    const isDark = theme === 'dark';
    
    return (
      <div className="flex items-center gap-3">
        {showLabel && (
          <span className="text-secondary dark:text-muted text-sm font-medium">
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </span>
        )}
        
        <button
          onClick={toggleTheme}
          className="relative inline-flex h-6 w-11 items-center rounded-full hover:cursor-pointer transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-gray-300 dark:bg-blue-600"
        >
          <span className="sr-only">Toggle theme</span>
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform duration-300 ${
              isDark ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    );
  };

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

  const addInterest = () => {
    const newInterest = prompt('Enter a new interest:');
    if (newInterest && !profileData.interests.includes(newInterest)) {
      setProfileData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest]
      }));
    }
  };

  const removeInterest = (interest) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const addHobby = () => {
    const newHobby = prompt('Enter a new hobby:');
    if (newHobby && !profileData.hobbies.includes(newHobby)) {
      setProfileData(prev => ({
        ...prev,
        hobbies: [...prev.hobbies, newHobby]
      }));
    }
  };

  const removeHobby = (hobby) => {
    setProfileData(prev => ({
      ...prev,
      hobbies: prev.hobbies.filter(h => h !== hobby)
    }));
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

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'appearance', name: 'Appearance', icon: '🎨' },
    { id: 'security', name: 'Security', icon: '🔒' }
  ];

  return (
    <div className="min-h-screen bg-card dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* ✅ Back Navigation */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-secondary dark:text-muted hover:text-primary hover:cursor-pointer dark:hover:text-white transition-colors duration-200"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Dashboard</span>
          </button>
        </div>
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary dark:text-white mb-2">Settings</h1>
          <p className="text-secondary dark:text-muted">Manage your account settings and preferences</p>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 rounded-lg">
            {message}
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-card dark:bg-gray-800 border border-primary dark:border-gray-700 rounded-lg p-1">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors hover:cursor-pointer duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white'
                        : 'text-secondary dark:text-muted hover:bg-hover dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="font-medium">{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Quick Actions im Sidebar */}
            <div className="mt-6 bg-card dark:bg-gray-800 border border-primary dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-primary dark:text-white mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full text-left p-2 text-sm text-secondary dark:text-muted hover:bg-hover hover:cursor-pointer dark:hover:bg-gray-700 rounded transition-colors"
                >
                  🏠 Dashboard
                </button>
                <button
                  onClick={onLogout}
                  className="w-full text-left p-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 hover:cursor-pointer dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>

          {/* Content bleibt gleich... */}
          <div className="lg:w-3/4">
            <div className="bg-card dark:bg-gray-800 border border-primary dark:border-gray-700 rounded-lg p-6">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-primary dark:text-white">Profile Information</h2>
                    {/* Save & Close Button */}
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-secondary dark:text-muted rounded-lg hover:bg-gray-200 hover:cursor-pointer dark:hover:bg-gray-600 transition-colors"
                    >
                      Save & Close
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={profileData.displayName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                        className="w-full px-4 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your display name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={user?.username || ''}
                        disabled
                        className="w-full px-4 py-2 border border-secondary dark:border-gray-600 bg-hover dark:bg-gray-600 text-primary dark:text-white rounded-lg opacity-50 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-4 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your first name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-4 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your last name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tell people about yourself..."
                      maxLength={500}
                    />
                    <p className="text-xs text-tertiary dark:text-muted mt-1">
                      {profileData.bio.length}/500 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={profileData.website}
                      onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-4 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://your-website.com"
                    />
                  </div>

                  {/* Interests */}
                  <div>
                    <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
                      Interests
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {profileData.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                        >
                          {interest}
                          <button
                            type="button"
                            onClick={() => removeInterest(interest)}
                            className="ml-1 text-blue-600 dark:text-blue-300 hover:text-red-500 hover:cursor-pointer transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addInterest}
                      className="px-4 py-2 bg-hover dark:bg-gray-700 text-secondary dark:text-gray-300 rounded-lg hover:bg-tertiary hover:cursor-pointer dark:hover:bg-gray-600 transition-colors text-sm"
                    >
                      + Add Interest
                    </button>
                  </div>

                  {/* Hobbies */}
                  <div>
                    <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
                      Hobbies
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {profileData.hobbies.map((hobby, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                        >
                          {hobby}
                          <button
                            type="button"
                            onClick={() => removeHobby(hobby)}
                            className="ml-1 text-blue-600 dark:text-blue-300 hover:text-red-500 hover:cursor-pointer transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addHobby}
                      className="px-4 py-2 bg-hover dark:bg-gray-700 text-secondary dark:text-gray-300 rounded-lg hover:bg-tertiary hover:cursor-pointer dark:hover:bg-gray-600 transition-colors text-sm"
                    >
                      + Add Hobby
                    </button>
                  </div>

                  <div className="flex justify-between pt-4">
                    {/* ✅ Back Button links */}
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 hover:cursor-pointer transition-colors"
                    >
                      Back to Dashboard
                    </button>
                    
                    {/* Save Button rechts */}
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 hover:cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-primary dark:text-white">Appearance</h2>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-secondary dark:text-muted rounded-lg hover:bg-gray-200 hover:cursor-pointer dark:hover:bg-gray-600 transition-colors"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-primary dark:text-white mb-4">Theme</h3>
                      <div className="flex items-center justify-between p-4 border border-primary dark:border-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-primary dark:text-white">Dark Mode</p>
                          <p className="text-sm text-secondary dark:text-muted">Toggle between light and dark themes</p>
                        </div>
                        <ThemeToggle />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-primary dark:text-white mb-4">Current Theme</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Light Theme Preview */}
                        <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${theme === 'light' ? 'border-blue-500' : 'border-primary dark:border-gray-700'}`}>
                          <div className="bg-white p-3 rounded shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                              <div className="h-3 bg-gray-800 rounded w-16"></div>
                            </div>
                            <div className="space-y-1">
                              <div className="h-2 bg-gray-300 rounded w-full"></div>
                              <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                            </div>
                          </div>
                          <p className="text-center mt-2 text-sm font-medium text-primary dark:text-white">Light Theme</p>
                        </div>

                        {/* Dark Theme Preview */}
                        <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${theme === 'dark' ? 'border-blue-500' : 'border-primary dark:border-gray-700'}`}>
                          <div className="bg-gray-800 p-3 rounded shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 bg-blue-400 rounded-full"></div>
                              <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                            <div className="space-y-1">
                              <div className="h-2 bg-gray-600 rounded w-full"></div>
                              <div className="h-2 bg-gray-600 rounded w-3/4"></div>
                            </div>
                          </div>
                          <p className="text-center mt-2 text-sm font-medium text-primary dark:text-white">Dark Theme</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-primary dark:text-white">Security</h2>
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-secondary dark:text-muted rounded-lg hover:bg-gray-200 hover:cursor-pointer dark:hover:bg-gray-600 transition-colors"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-primary dark:text-white">Change Password</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-4 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your current password"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your new password"
                        minLength={6}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Confirm your new password"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 hover:cursor-pointer transition-colors"
                    >
                      Back to Dashboard
                    </button>
                    
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 hover:cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;