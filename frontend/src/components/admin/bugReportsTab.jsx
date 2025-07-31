import { useState, useEffect } from 'react';
import {
  Bug,
  Search,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  User,
  Calendar,
  Monitor,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import AdminService from '../../services/adminService';

const BugReportsTab = () => {
  const [bugReports, setBugReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    priority: '',
    category: '',
    search: ''
  });
  const [pagination, setPagination] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [stats, setStats] = useState({});
  const [error, setError] = useState('');

  const statusOptions = [
    { value: '', label: 'Alle Status' },
    { value: 'open', label: 'Offen', icon: '🔴', color: 'text-red-600' },
    { value: 'in_progress', label: 'In Bearbeitung', icon: '🟡', color: 'text-yellow-600' },
    { value: 'resolved', label: 'Gelöst', icon: '🟢', color: 'text-green-600' },
    { value: 'closed', label: 'Geschlossen', icon: '⚫', color: 'text-tertiary' },
    { value: 'duplicate', label: 'Duplikat', icon: '🔄', color: 'text-blue-600' },
    { value: 'invalid', label: 'Ungültig', icon: '❌', color: 'text-red-600' }
  ];

  const priorityOptions = [
    { value: '', label: 'Alle Prioritäten' },
    { value: 'low', label: 'Niedrig', color: 'text-green-600' },
    { value: 'medium', label: 'Mittel', color: 'text-yellow-600' },
    { value: 'high', label: 'Hoch', color: 'text-orange-600' },
    { value: 'critical', label: 'Kritisch', color: 'text-red-600' }
  ];

  const categoryOptions = [
    { value: '', label: 'Alle Kategorien' },
    { value: 'ui', label: 'UI/Design', icon: '🎨' },
    { value: 'functionality', label: 'Funktionalität', icon: '⚙️' },
    { value: 'performance', label: 'Performance', icon: '⚡' },
    { value: 'security', label: 'Sicherheit', icon: '🔒' },
    { value: 'data', label: 'Daten', icon: '📊' },
    { value: 'other', label: 'Sonstiges', icon: '🐛' }
  ];

  useEffect(() => {
    loadBugReports();
    loadStats();
    // eslint-disable-next-line
  }, [filters]);

  const loadBugReports = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await AdminService.getAllBugReports(filters);
      if (result.success) {
        setBugReports(result.data.bugReports || []);
        setPagination(result.data.pagination || {});
      } else {
        setError(result.error || 'Fehler beim Laden der Bug Reports');
      }
    } catch (error) {
      setError('Fehler beim Laden der Bug Reports');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await AdminService.getBugReportStats();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      // ignore
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleStatusUpdate = async (reportId, newStatus) => {
    try {
      const result = await AdminService.updateBugReportStatus(reportId, {
        status: newStatus
      });

      if (result.success) {
        setBugReports(prev =>
          prev.map(report =>
            report.id === reportId
              ? { ...report, status: newStatus, updatedAt: new Date().toISOString() }
              : report
          )
        );
        loadStats();
      }
    } catch (error) {
      setError('Fehler beim Aktualisieren des Status');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Bug Report löschen möchten?')) {
      return;
    }

    try {
      const result = await AdminService.deleteBugReport(reportId);

      if (result.success) {
        setBugReports(prev => prev.filter(report => report.id !== reportId));
        loadStats();
      }
    } catch (error) {
      setError('Fehler beim Löschen des Bug Reports');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.icon : '❓';
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.color : 'text-tertiary';
  };

  const getPriorityColor = (priority) => {
    const priorityOption = priorityOptions.find(opt => opt.value === priority);
    return priorityOption ? priorityOption.color : 'text-tertiary';
  };

  const getCategoryIcon = (category) => {
    const categoryOption = categoryOptions.find(opt => opt.value === category);
    return categoryOption ? categoryOption.icon : '🐛';
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Bug className="w-6 h-6 text-red-600" />
            <p className='text-primary'>Bug Reports</p>
          </h2>
          <p className="text-tertiary">Verwalte eingereichte Bug Reports</p>
        </div>
        <div className="flex space-x-4">
          {stats.byStatus && Object.entries(stats.byStatus).map(([status, count]) => (
            <div key={status} className="text-center">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className={`text-sm ${getStatusColor(status)}`}>
                {getStatusIcon(status)} {statusOptions.find(opt => opt.value === status)?.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-primary rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Suche nach Titel oder Beschreibung..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 bg-secondary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg cursor-pointer bg-secondary focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-secondary cursor-pointer focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {priorityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-secondary cursor-pointer focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {/* Clear Filters */}
          <button
            onClick={() => setFilters({
              page: 1,
              limit: 20,
              status: '',
              priority: '',
              category: '',
              search: ''
            })}
            className="px-4 py-2 text-tertiary bg-secondary border-1 border-primary cursor-pointer hover:text-secondary hover:bg-secondary rounded-lg transition-colors"
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>

      {/* Bug Reports Table */}
      <div className="bg-card rounded-lg shadow-sm border border-card">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-tertiary">Lade Bug Reports...</p>
          </div>
        ) : bugReports.length === 0 ? (
          <div className="p-8 text-center">
            <Bug className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-tertiary">Keine Bug Reports gefunden</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titel</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priorität</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reporter</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {bugReports.map(report => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className={`px-4 py-3 whitespace-nowrap font-bold ${getStatusColor(report.status)}`}>
                      {getStatusIcon(report.status)} {statusOptions.find(opt => opt.value === report.status)?.label}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap max-w-xs truncate">
                      <span className="font-medium">{report.title}</span>
                      <div className="text-xs text-gray-500">{report.description?.slice(0, 60)}{report.description?.length > 60 ? '...' : ''}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getCategoryIcon(report.category)} {categoryOptions.find(opt => opt.value === report.category)?.label}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap font-bold ${getPriorityColor(report.priority)}`}>
                      {priorityOptions.find(opt => opt.value === report.priority)?.label}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{report.reporter?.displayName || report.reporter?.username || 'Unbekannt'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Calendar className="w-4 h-4 text-gray-400 inline mr-1" />
                      {formatDate(report.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap flex items-center space-x-2">
                      <button
                        className="p-1 rounded hover:bg-gray-100"
                        title="Details ansehen"
                        onClick={() => setSelectedReport(report)}
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>
                      <select
                        value={report.status}
                        onChange={e => handleStatusUpdate(report.id, e.target.value)}
                        className="px-2 py-1 border border-gray-200 rounded text-xs"
                      >
                        {statusOptions.filter(opt => opt.value).map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <button
                        className="p-1 rounded hover:bg-gray-100"
                        title="Löschen"
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-4">
          <button
            disabled={filters.page === 1}
            onClick={() => handlePageChange(filters.page - 1)}
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            &lt;
          </button>
          <span>
            Seite {filters.page} von {pagination.totalPages}
          </span>
          <button
            disabled={filters.page === pagination.totalPages}
            onClick={() => handlePageChange(filters.page + 1)}
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            &gt;
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Bug className="w-6 h-6 text-red-600" />
                <h2 className="text-xl font-bold text-gray-900">Bug Report Details</h2>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <span className={`font-bold ${getStatusColor(selectedReport.status)}`}>
                  {getStatusIcon(selectedReport.status)} {statusOptions.find(opt => opt.value === selectedReport.status)?.label}
                </span>
                <span className={`font-bold ${getPriorityColor(selectedReport.priority)}`}>
                  {priorityOptions.find(opt => opt.value === selectedReport.priority)?.label}
                </span>
                <span>
                  {getCategoryIcon(selectedReport.category)} {categoryOptions.find(opt => opt.value === selectedReport.category)?.label}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedReport.title}</h3>
                <p className="text-secondary whitespace-pre-line">{selectedReport.description}</p>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <User className="w-4 h-4" />
                <span>{selectedReport.reporter?.displayName || selectedReport.reporter?.username || 'Unbekannt'}</span>
                <Calendar className="w-4 h-4" />
                <span>{formatDate(selectedReport.createdAt)}</span>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Monitor className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Systeminfo</span>
                </div>
                <pre className="text-xs text-secondary whitespace-pre-wrap break-all">
                  {selectedReport.browserInfo}
                </pre>
              </div>
              {selectedReport.adminNotes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium text-yellow-900">Admin Notiz</span>
                  </div>
                  <p className="text-sm text-yellow-800">{selectedReport.adminNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 mt-4">
          {error}
        </div>
      )}
    </div>
  );
};

export default BugReportsTab;