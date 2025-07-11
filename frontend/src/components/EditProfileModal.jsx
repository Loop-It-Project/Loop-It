import { useState } from 'react';
import { X, Save, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import { Hash } from 'lucide-react';
import TagInput from './TagInput';
import UserProfileService from '../services/userProfileService';

const EditProfileModal = ({ profile, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    bio: profile?.bio || '',
    website: profile?.website || '',
    socialLinks: profile?.socialLinks || {},
    interests: profile?.interests || [],
    hobbies: profile?.hobbies || []
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Social Media Platforms
  const socialPlatforms = [
    { key: 'twitter', label: 'Twitter', placeholder: 'https://twitter.com/username' },
    { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSocialLinkChange = (platform, url) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: url
      }
    }));
  };

  const removeSocialLink = (platform) => {
    const newSocialLinks = { ...formData.socialLinks };
    delete newSocialLinks[platform];
    setFormData(prev => ({ ...prev, socialLinks: newSocialLinks }));
  };

    const handleArrayChange = (field, value) => {
      // Aufteilen bei Komma, trimmen und leere Einträge entfernen
      const items = value
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
    
      setFormData(prev => ({ ...prev, [field]: items }));
    
      // Debugging
      console.log(`🏷️ ${field} updated:`, items);
    };

  const validateForm = () => {
    const newErrors = {};

    if (formData.displayName && formData.displayName.length > 100) {
      newErrors.displayName = 'Display Name darf maximal 100 Zeichen haben';
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio darf maximal 500 Zeichen haben';
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Bitte gib eine gültige URL ein';
    }

    // Social Links validieren
    Object.entries(formData.socialLinks).forEach(([platform, url]) => {
      if (url && !isValidUrl(url)) {
        newErrors[`social_${platform}`] = 'Bitte gib eine gültige URL ein';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔍 EditModal - Form data being sent:', formData);
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Entferne leere Social Links
      const cleanedSocialLinks = Object.entries(formData.socialLinks)
        .filter(([_, url]) => url && url.trim())
        .reduce((acc, [platform, url]) => ({ ...acc, [platform]: url }), {});

      const updateData = {
        displayName: formData.displayName || null,
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        bio: formData.bio || null,
        website: formData.website || null,
        socialLinks: Object.keys(cleanedSocialLinks).length > 0 ? cleanedSocialLinks : null,
        interests: formData.interests.length > 0 ? formData.interests : [],
        hobbies: formData.hobbies.length > 0 ? formData.hobbies : []
      };

      console.log('🚀 EditModal - Sending update data:', updateData);

      const response = await UserProfileService.updateProfile(updateData);
      
      console.log('📥 EditModal - Response:', response);
      
      if (response.success) {
        onSave(updateData);
    } else {
          // Error-Anzeige
          console.error('❌ Profile update failed:', response);
        
          if (response.errors && Array.isArray(response.errors)) {
            // Validierungsfehler anzeigen
            const errorMessages = response.errors.map(err => err.msg || err.message).join(', ');
            setErrors({ submit: `Validierungsfehler: ${errorMessages}` });
          } else {
            setErrors({ submit: response.error || response.message || 'Fehler beim Speichern des Profils' });
          }
        }
      } catch (error) {
        console.error('Update profile error:', error);
        setErrors({ submit: 'Netzwerkfehler. Bitte versuche es erneut.' });
      } finally {
        setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary">
          <h2 className="text-xl font-bold text-primary">Profil bearbeiten</h2>
          <button
            onClick={onClose}
            className="text-tertiary hover:text-secondary transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-primary">Grundinformationen</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Anzeigename
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Dein Anzeigename"
                />
                {errors.displayName && (
                  <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="https://deine-website.de"
                />
                {errors.website && (
                  <p className="text-red-500 text-sm mt-1">{errors.website}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-secondary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                placeholder="Erzähle etwas über dich..."
              />
              <div className="flex justify-between items-center mt-1">
                {errors.bio && (
                  <p className="text-red-500 text-sm">{errors.bio}</p>
                )}
                <p className="text-tertiary text-sm ml-auto">
                  {formData.bio.length}/500
                </p>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-primary">Social Media Links</h3>
            
            {socialPlatforms.map((platform) => (
              <div key={platform.key} className="flex items-center space-x-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-secondary mb-1">
                    {platform.label}
                  </label>
                  <input
                    type="url"
                    value={formData.socialLinks[platform.key] || ''}
                    onChange={(e) => handleSocialLinkChange(platform.key, e.target.value)}
                    className="w-full px-3 py-2 border border-secondary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder={platform.placeholder}
                  />
                  {errors[`social_${platform.key}`] && (
                    <p className="text-red-500 text-sm mt-1">{errors[`social_${platform.key}`]}</p>
                  )}
                </div>
                
                {formData.socialLinks[platform.key] && (
                  <button
                    type="button"
                    onClick={() => removeSocialLink(platform.key)}
                    className="text-red-500 hover:text-red-700 mt-6"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

            {/* Interests & Hobbies */}
            <div className="space-y-6">
              <h3 className="font-semibold text-primary">Interessen & Hobbys</h3>
                    
              <TagInput
                label="Interessen"
                value={formData.interests}
                onChange={(newInterests) => handleInputChange('interests', newInterests)}
                placeholder="Was interessiert dich? (z.B. Technologie, Design, Sport)"
                maxTags={8}
                type="interests"
              />
            
              <TagInput
                label="Hobbys"
                value={formData.hobbies}
                onChange={(newHobbies) => handleInputChange('hobbies', newHobbies)}
                placeholder="Was sind deine Hobbys? (z.B. Gaming, Fotografie, Kochen)"
                maxTags={8}
                type="hobbies"
              />
            </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-primary">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-secondary hover:text-primary transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Speichern...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Speichern</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;