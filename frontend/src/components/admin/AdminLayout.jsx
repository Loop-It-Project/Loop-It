import { ArrowLeft, Shield, BarChart3, Users, Flag, CheckCircle, Globe, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminLayout = ({ user, onLogout, activeTab, setActiveTab, children, error, message }) => {
  const navigate = useNavigate();

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, description: 'Übersicht & Metriken' },
    { id: 'users', name: 'Users', icon: Users, description: 'Nutzerverwaltung' },
    { id: 'moderation', name: 'Moderation', icon: Flag, description: 'Reports & Moderationen' },
    { id: 'reports', name: 'Reports', icon: AlertTriangle, description: 'User Reports & Meldungen' },
    { id: 'approvals', name: 'Approvals', icon: CheckCircle, description: 'Genehmigungen' },
    { id: 'universes', name: 'Universes', icon: Globe, description: 'Universe Management' }
  ];

  return (
    <div className="min-h-screen bg-card dark:bg-gray-900">
      {/* Admin Header */}
      <div className="bg-card dark:bg-gray-800 border-b border-primary dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-secondary dark:text-muted hover:text-primary dark:hover:text-white hover:bg-hover dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center space-x-3">
                <Shield className="text-blue-600" size={24} />
                <div>
                  <h1 className="text-xl font-bold text-primary dark:text-white">Admin Panel</h1>
                  <p className="text-sm text-secondary dark:text-muted">Loop-It Administration</p>
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-secondary dark:text-muted">
                Angemeldet als <span className="font-medium text-primary dark:text-white">{user?.displayName || user?.username}</span>
              </div>
              <button
                onClick={() => onLogout()}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 hover:cursor-pointer transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}
        
        {message && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 rounded-lg">
            {message}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors hover:cursor-pointer ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-secondary dark:text-muted hover:text-primary dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon size={16} />
                      <span>{tab.name}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;