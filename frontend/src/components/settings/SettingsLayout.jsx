import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SettingsLayout = ({ 
  user, 
  onLogout, 
  activeTab, 
  setActiveTab, 
  children, 
  error, 
  message 
}) => {
  const navigate = useNavigate();

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'location', name: 'Location', icon: '📍' },
    { id: 'appearance', name: 'Appearance', icon: '🎨' },
    { id: 'security', name: 'Security', icon: '🔒' }
  ];

  return (
    <div className="min-h-screen bg-primary dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Back Navigation */}
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

            {/* Quick Actions */}
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

          {/* Content */}
          <div className="lg:w-3/4">
            <div className="bg-card dark:bg-gray-800 border border-primary dark:border-gray-700 rounded-lg p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;