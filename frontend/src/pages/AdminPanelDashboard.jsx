import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Flag, 
  CheckCircle, 
  BarChart3, 
  Shield, 
  AlertTriangle,
  ArrowLeft,
  Search,
  Filter,
  UserCheck,
  Globe,
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import AdminService from '../services/adminService';

const AdminPanel = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  // States for different sections
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [approvals, setApprovals] = useState(null);
  
  // Pagination & Search
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('');
  const [reportStatus, setReportStatus] = useState('pending');

  // Tabs Configuration
  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, description: 'Übersicht & Metriken' },
    { id: 'users', name: 'Users', icon: Users, description: 'Nutzerverwaltung' },
    { id: 'moderation', name: 'Moderation', icon: Flag, description: 'Reports & Moderationen' },
    { id: 'approvals', name: 'Approvals', icon: CheckCircle, description: 'Genehmigungen' },
    { id: 'universes', name: 'Universes', icon: Globe, description: 'Universe Management' }
  ];

  // Check Admin Access
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const result = await AdminService.checkAdminPermissions();
        if (!result.success || !result.isAdmin) {
          alert('Du hast keine Admin-Berechtigung!');
          navigate('/dashboard');
          return;
        }
        setLoading(false);
      } catch (error) {
        console.error('Admin access check error:', error);
        alert('Fehler beim Prüfen der Admin-Berechtigung');
        navigate('/dashboard');
      }
    };

    checkAccess();
  }, [navigate]);

  // Load Dashboard Metrics
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardMetrics();
    }
  }, [activeTab]);

  // Load Users
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, userPage, userSearch, userRole]);

  // Load Reports
  useEffect(() => {
    if (activeTab === 'moderation') {
      loadModerationReports();
    }
  }, [activeTab, reportStatus]);

  // Load Approvals
  useEffect(() => {
    if (activeTab === 'approvals') {
      loadPendingApprovals();
    }
  }, [activeTab]);

  // Data Loading Functions
  const loadDashboardMetrics = async () => {
    try {
      setError('');
      const result = await AdminService.getDashboardMetrics();
      if (result.success) {
        setMetrics(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Fehler beim Laden der Metriken');
    }
  };

  const loadUsers = async () => {
    try {
      setError('');
      const result = await AdminService.getAllUsers(userPage, 50, userSearch, userRole);
      if (result.success) {
        setUsers(result.data.users);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Fehler beim Laden der Nutzer');
    }
  };

  const loadModerationReports = async () => {
    try {
      setError('');
      const result = await AdminService.getModerationReports(1, 20, reportStatus);
      if (result.success) {
        setReports(result.data.reports);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Fehler beim Laden der Reports');
    }
  };

  const loadPendingApprovals = async () => {
    try {
      setError('');
      const result = await AdminService.getPendingApprovals();
      if (result.success) {
        setApprovals(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Fehler beim Laden der Genehmigungen');
    }
  };

  // Actions
  const handleAssignModerator = async (universeId, userId) => {
    try {
      const result = await AdminService.assignUniverseModerator(universeId, userId);
      if (result.success) {
        setMessage('Moderator erfolgreich zugewiesen!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Fehler beim Zuweisen des Moderators');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-card dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield size={48} className="mx-auto mb-4 text-blue-600" />
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary dark:text-muted">Überprüfe Admin-Berechtigung...</p>
        </div>
      </div>
    );
  }

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
        {activeTab === 'dashboard' && (
          <DashboardTab metrics={metrics} onRefresh={loadDashboardMetrics} />
        )}

        {activeTab === 'users' && (
          <UsersTab 
            users={users}
            search={userSearch}
            setSearch={setUserSearch}
            role={userRole}
            setRole={setUserRole}
            onAssignModerator={handleAssignModerator}
          />
        )}

        {activeTab === 'moderation' && (
          <ModerationTab 
            reports={reports}
            status={reportStatus}
            setStatus={setReportStatus}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalsTab approvals={approvals} />
        )}

        {activeTab === 'universes' && (
          <UniversesTab />
        )}
      </div>
    </div>
  );
};

// Dashboard Tab Component
const DashboardTab = ({ metrics, onRefresh }) => {
  if (!metrics) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-secondary dark:text-muted">Lade Dashboard-Metriken...</p>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Gesamt-Nutzer',
      value: metrics.users?.total || 0,
      subtitle: `${metrics.users?.newToday || 0} neue heute`,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Universes',
      value: metrics.universes?.total || 0,
      subtitle: `${metrics.universes?.pendingApproval || 0} warten auf Genehmigung`,
      icon: Globe,
      color: 'purple'
    },
    {
      title: 'Posts',
      value: metrics.posts?.total || 0,
      subtitle: `${metrics.posts?.today || 0} heute erstellt`,
      icon: MessageSquare,
      color: 'green'
    },
    {
      title: 'Pending Reports',
      value: metrics.moderation?.pendingReports || 0,
      subtitle: 'Benötigen Aufmerksamkeit',
      icon: AlertTriangle,
      color: 'red'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary dark:text-white">Dashboard Übersicht</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:cursor-pointer transition-colors"
        >
          Aktualisieren
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          const colorClasses = {
            blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
            purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
            green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
            red: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
          };

          return (
            <div key={index} className="bg-card dark:bg-gray-800 border border-primary dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[metric.color]}`}>
                  <Icon size={24} />
                </div>
                <TrendingUp size={16} className="text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary dark:text-white">{metric.value.toLocaleString()}</p>
                <p className="text-sm font-medium text-secondary dark:text-gray-300">{metric.title}</p>
                <p className="text-xs text-tertiary dark:text-muted mt-1">{metric.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-card dark:bg-gray-800 border border-primary dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-primary dark:text-white mb-4">Letzte Aktivitäten</h3>
        <div className="text-center py-8 text-secondary dark:text-muted">
          <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aktivitäts-Dashboard wird bald verfügbar sein</p>
        </div>
      </div>
    </div>
  );
};

// Users Tab Component
const UsersTab = ({ users, search, setSearch, role, setRole, onAssignModerator }) => {
  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-primary dark:text-white">Nutzerverwaltung</h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary dark:text-muted" />
            <input
              type="text"
              placeholder="Nutzer suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
            />
          </div>
          
          {/* Role Filter */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-4 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Alle Rollen</option>
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-card dark:bg-gray-800 border border-primary dark:border-gray-700 rounded-lg overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto mb-4 text-tertiary dark:text-muted opacity-50" />
            <p className="text-secondary dark:text-muted">Keine Nutzer gefunden</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-hover dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary dark:text-gray-300 uppercase tracking-wider">Nutzer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary dark:text-gray-300 uppercase tracking-wider">Letzte Anmeldung</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary dark:text-gray-300 uppercase tracking-wider">Premium</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary dark:text-gray-300 uppercase tracking-wider">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-hover dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {(user.displayName || user.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-primary dark:text-white">
                            {user.displayName || user.username}
                          </div>
                          <div className="text-sm text-secondary dark:text-muted">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.accountStatus === 'active' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {user.accountStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary dark:text-muted">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('de-DE') : 'Nie'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.premiumTier === 'premium' 
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {user.premiumTier}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {/* TODO: Implement user details modal */}}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:cursor-pointer"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => {/* TODO: Implement moderator assignment modal */}}
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 hover:cursor-pointer"
                      >
                        <UserCheck size={16} className="inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Moderation Tab Component
const ModerationTab = ({ reports, status, setStatus }) => {
  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-primary dark:text-white">Moderation & Reports</h2>
        
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="pending">Ausstehend</option>
          <option value="resolved">Bearbeitet</option>
          <option value="dismissed">Abgelehnt</option>
        </select>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="bg-card dark:bg-gray-800 border border-primary dark:border-gray-700 rounded-lg text-center py-12">
            <Flag size={48} className="mx-auto mb-4 text-tertiary dark:text-muted opacity-50" />
            <p className="text-secondary dark:text-muted">Keine Reports gefunden</p>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="bg-card dark:bg-gray-800 border border-primary dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Flag size={16} className="text-red-500" />
                    <span className="font-medium text-primary dark:text-white">
                      {report.reportedContentType} Report
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      report.status === 'pending' 
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-sm text-secondary dark:text-muted mb-2">
                    Grund: <span className="font-medium">{report.reason}</span>
                  </p>
                  {report.description && (
                    <p className="text-sm text-secondary dark:text-muted">{report.description}</p>
                  )}
                </div>
                <div className="text-sm text-tertiary dark:text-muted">
                  {new Date(report.createdAt).toLocaleDateString('de-DE')}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-secondary dark:text-muted">
                  Gemeldet von: <span className="font-medium">{report.reporterUsername}</span>
                  {report.reportedUsername && (
                    <span> • Betrifft: <span className="font-medium">{report.reportedUsername}</span></span>
                  )}
                </div>
                
                {report.status === 'pending' && (
                  <div className="space-x-2">
                    <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 hover:cursor-pointer transition-colors">
                      Bearbeiten
                    </button>
                    <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 hover:cursor-pointer transition-colors">
                      Ablehnen
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Approvals Tab Component
const ApprovalsTab = ({ approvals }) => {
  if (!approvals) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-secondary dark:text-muted">Lade Genehmigungen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary dark:text-white">Ausstehende Genehmigungen</h2>
      
      {/* Universe Join Requests */}
      <div className="bg-card dark:bg-gray-800 border border-primary dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-primary dark:text-white mb-4">Universe Beitrittsanfragen</h3>
        
        {approvals.universeJoinRequests?.length === 0 ? (
          <p className="text-secondary dark:text-muted">Keine ausstehenden Beitrittsanfragen</p>
        ) : (
          <div className="space-y-3">
            {approvals.universeJoinRequests?.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded">
                <div>
                  <p className="font-medium text-primary dark:text-white">
                    {request.displayName || request.username} möchte "{request.universeName}" beitreten
                  </p>
                  {request.message && (
                    <p className="text-sm text-secondary dark:text-muted">{request.message}</p>
                  )}
                </div>
                <div className="space-x-2">
                  <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 hover:cursor-pointer transition-colors">
                    Genehmigen
                  </button>
                  <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 hover:cursor-pointer transition-colors">
                    Ablehnen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Universes Tab Component
const UniversesTab = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary dark:text-white">Universe Management</h2>
      
      <div className="bg-card dark:bg-gray-800 border border-primary dark:border-gray-700 rounded-lg p-6 text-center">
        <Globe size={48} className="mx-auto mb-4 text-tertiary dark:text-muted opacity-50" />
        <p className="text-secondary dark:text-muted">Universe Management wird bald verfügbar sein</p>
      </div>
    </div>
  );
};

export default AdminPanel;