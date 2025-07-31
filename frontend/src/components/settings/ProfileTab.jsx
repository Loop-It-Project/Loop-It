import { useNavigate } from 'react-router-dom';

const ProfileTab = ({ 
  profileData, 
  setProfileData, 
  user, 
  saving, 
  onSubmit 
}) => {
  const navigate = useNavigate();

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

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-primary dark:text-white">Profile Information</h2>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-secondary dark:text-muted rounded-lg hover:bg-gray-200 hover:cursor-pointer dark:hover:bg-gray-600 transition-colors"
        >
          Save & Close
        </button>
      </div>
      
      {/* Name Fields */}
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

      {/* Bio */}
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

      {/* Website */}
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

      {/* Submit Buttons */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 bg-card text-white rounded-lg hover:bg-gray-600 hover:cursor-pointer transition-colors"
        >
          Back to Dashboard
        </button>
        
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 hover:cursor-pointer transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
};

export default ProfileTab;