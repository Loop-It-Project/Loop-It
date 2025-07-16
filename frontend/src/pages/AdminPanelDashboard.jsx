import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle } from 'lucide-react';
import AdminService from '../services/adminService';

// Import der Komponenten
import AdminLayout from '../components/admin/AdminLayout';
import DashboardTab from '../components/admin/DashboardTab';
import UsersTab from '../components/admin/UsersTab';
import ModerationTab from '../components/admin/ModerationTab';
import ApprovalsTab from '../components/admin/ApprovalsTab';
import UniversesTab from '../components/admin/UniversesTab';
import ReportsTab from '../components/admin/ReportsTab';
import BugReportsTab from '../components/admin/bugReportsTab';

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
    if (activeTab === 'reports') {
      loadReports();
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

  // Load Approvals
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

  // Reports laden
  const loadReports = async () => {
    try {
      setError('');
      const result = await AdminService.getReports(1, 20, reportStatus);
      if (result.success) {
        setReports(result.data.reports || []);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Fehler beim Laden der Reports');
    }
  };

  // Legacy: Moderation Data (falls separater Tab)
  const loadModerationData = async () => {
    try {
      setError('');
      const result = await AdminService.getModerationReports(1, 20, 'pending');
      if (result.success) {
        setReports(result.data.reports || []);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Fehler beim Laden der Moderation-Daten');
    }
  };

  // Report Processing Handler
  const handleProcessReport = async (reportId, actionData) => {
    try {
      setError('');
      const result = await AdminService.processReport(reportId, actionData);
      if (result.success) {
        setMessage('Report erfolgreich bearbeitet!');
        // Report aus Liste entfernen
        setReports(prev => prev.filter(r => r.id !== reportId));
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Fehler beim Bearbeiten des Reports');
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
    <AdminLayout 
      user={user} 
      onLogout={onLogout}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      error={error}
      message={message}
    >
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
          onProcessReport={handleProcessReport}
        />
      )}


      {activeTab === 'reports' && (
        <ReportsTab 
          reports={reports}
          status={reportStatus}
          setStatus={setReportStatus}
          onProcessReport={handleProcessReport}
          onRefresh={loadReports}
        />
      )}

      {activeTab === 'approvals' && (
        <ApprovalsTab approvals={approvals} />
      )}

      {activeTab === 'universes' && (
        <UniversesTab />
      )}

      {activeTab === 'bug-reports' && (
        <BugReportsTab />
      )}
    </AdminLayout>
  );
};

export default AdminPanel;