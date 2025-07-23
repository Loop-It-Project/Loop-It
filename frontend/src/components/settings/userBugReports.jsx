import { useState, useEffect } from 'react';
import { Bug, Calendar, Eye, ArrowLeft, AlertCircle } from 'lucide-react';
import BugReportService from '../../services/bugReportService';

const UserBugReports = ({ onBack }) => {
  const [bugReports, setBugReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadBugReports();
  }, []);

  const loadBugReports = async () => {
    setLoading(true);
    try {
      const result = await BugReportService.getUserBugReports();
      if (result.success) {
        setBugReports(result.data.bugReports || []);
        setPagination(result.data.pagination || {});
      } else {
        setError(result.error || 'Fehler beim Laden der Bug Reports');
      }
    } catch (error) {
      setError('Netzwerkfehler beim Laden der Bug Reports');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'text-red-600 bg-red-100';
      case 'in_progress': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-tertiary bg-gray-100';
      case 'duplicate': return 'text-blue-600 bg-blue-100';
      case 'invalid': return 'text-purple-600 bg-purple-100';
      default: return 'text-tertiary bg-gray-100';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'open': return 'Offen';
      case 'in_progress': return 'In Bearbeitung';
      case 'resolved': return 'Gelöst';
      case 'closed': return 'Geschlossen';
      case 'duplicate': return 'Duplikat';
      case 'invalid': return 'Ungültig';
      default: return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-tertiary';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'low': return 'Niedrig';
      case 'medium': return 'Mittel';
      case 'high': return 'Hoch';
      case 'critical': return 'Kritisch';
      default: return priority;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'ui': return 'UI/Design';
      case 'functionality': return 'Funktionalität';
      case 'performance': return 'Performance';
      case 'security': return 'Sicherheit';
      case 'data': return 'Daten';
      case 'other': return 'Sonstiges';
      default: return category;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-tertiary">Lade Bug Reports...</p>
      </div>
    );
  }

  if (selectedReport) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSelectedReport(null)}
            className="flex items-center space-x-2 text-tertiary hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Zurück zur Übersicht</span>
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Bug className="text-red-500" size={24} />
            <h2 className="text-xl font-bold text-gray-900">{selectedReport.title}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <span className="text-sm text-gray-500">Status</span>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedReport.status)}`}>
                {getStatusLabel(selectedReport.status)}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Priorität</span>
              <div className={`font-medium ${getPriorityColor(selectedReport.priority)}`}>
                {getPriorityLabel(selectedReport.priority)}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Kategorie</span>
              <div className="font-medium text-secondary">{getCategoryLabel(selectedReport.category)}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Beschreibung</h3>
              <p className="text-secondary whitespace-pre-line">{selectedReport.description}</p>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar size={16} />
                <span>Erstellt: {new Date(selectedReport.createdAt).toLocaleDateString('de-DE')}</span>
              </div>
              {selectedReport.updatedAt !== selectedReport.createdAt && (
                <div className="flex items-center space-x-1">
                  <span>Aktualisiert: {new Date(selectedReport.updatedAt).toLocaleDateString('de-DE')}</span>
                </div>
              )}
              {selectedReport.resolvedAt && (
                <div className="flex items-center space-x-1">
                  <span>Gelöst: {new Date(selectedReport.resolvedAt).toLocaleDateString('de-DE')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Meine Bug Reports</h2>
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-tertiary hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Zurück</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="text-red-500 mt-0.5" size={20} />
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {bugReports.length === 0 ? (
        <div className="text-center py-8">
          <Bug className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-tertiary">Du hast noch keine Bug Reports erstellt.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bugReports.map((report) => (
            <div
              key={report.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-gray-900">{report.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {getStatusLabel(report.status)}
                    </span>
                  </div>
                  <p className="text-tertiary text-sm mb-3 line-clamp-2">{report.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className={`font-medium ${getPriorityColor(report.priority)}`}>
                      {getPriorityLabel(report.priority)}
                    </span>
                    <span>{getCategoryLabel(report.category)}</span>
                    <span className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>{new Date(report.createdAt).toLocaleDateString('de-DE')}</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReport(report)}
                  className="ml-4 p-2 text-gray-400 hover:text-tertiary transition-colors"
                  title="Details ansehen"
                >
                  <Eye size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserBugReports;