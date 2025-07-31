import { useNavigate } from 'react-router-dom';

const PrivacyTab = ({ 
  privacySettings, 
  setPrivacySettings, 
  saving, 
  onSubmit 
}) => {
  const navigate = useNavigate();

  const messageOptions = [
    { 
      value: 'everyone', 
      label: 'Jeder', 
      description: 'Alle Nutzer können dir Nachrichten senden',
      icon: '🌐'
    },
    { 
      value: 'universe_members', 
      label: 'Universe-Mitglieder', 
      description: 'Nur Nutzer aus gemeinsamen Universes können dir schreiben',
      icon: '🌌'
    },
    { 
      value: 'friends', 
      label: 'Nur Freunde', 
      description: 'Nur deine Freunde können dir Nachrichten senden',
      icon: '👥'
    },
    { 
      value: 'none', 
      label: 'Niemand', 
      description: 'Du erhältst keine Nachrichten von anderen Nutzern',
      icon: '🚫'
    }
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-primary dark:text-white">Privatsphäre & Nachrichten</h2>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 text-sm bg-card dark:bg-gray-700 text-secondary dark:text-muted rounded-lg hover:bg-gray-200 hover:cursor-pointer dark:hover:bg-gray-600 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Profile Visibility */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-primary dark:text-white">Profil-Sichtbarkeit</h3>
        
        <div>
          <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
            Wer kann dein Profil sehen?
          </label>
          <select
            value={privacySettings.profileVisibility}
            onChange={(e) => setPrivacySettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
            className="w-full px-4 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="public">Öffentlich - Jeder kann mein Profil sehen</option>
            <option value="friends">Freunde - Nur meine Freunde können mein Profil sehen</option>
            <option value="private">Privat - Nur ich kann mein Profil sehen</option>
          </select>
        </div>
      </div>

      {/* Message Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-primary dark:text-white">Nachrichten-Einstellungen</h3>
        
        <div>
          <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-3">
            Wer darf dir Nachrichten senden?
          </label>
          <div className="space-y-3">
            {messageOptions.map((option) => (
              <label 
                key={option.value} 
                className="flex items-start space-x-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-hover dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <input
                  type="radio"
                  name="allowMessagesFrom"
                  value={option.value}
                  checked={privacySettings.allowMessagesFrom === option.value}
                  onChange={(e) => setPrivacySettings(prev => ({ ...prev, allowMessagesFrom: e.target.value }))}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{option.icon}</span>
                    <span className="font-medium text-primary dark:text-white">{option.label}</span>
                  </div>
                  <p className="text-sm text-secondary dark:text-muted mt-1">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Privacy Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-primary dark:text-white">Weitere Einstellungen</h3>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={privacySettings.showAge}
              onChange={(e) => setPrivacySettings(prev => ({ ...prev, showAge: e.target.checked }))}
              className="text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-primary dark:text-white">Alter anzeigen</span>
              <p className="text-xs text-secondary dark:text-muted">Zeige dein Alter in deinem Profil</p>
            </div>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={privacySettings.showLocation}
              onChange={(e) => setPrivacySettings(prev => ({ ...prev, showLocation: e.target.checked }))}
              className="text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-primary dark:text-white">Standort anzeigen</span>
              <p className="text-xs text-secondary dark:text-muted">Zeige deine allgemeine Region in deinem Profil</p>
            </div>
          </label>
        </div>
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
          {saving ? 'Saving...' : 'Save Privacy Settings'}
        </button>
      </div>
    </form>
  );
};

export default PrivacyTab;