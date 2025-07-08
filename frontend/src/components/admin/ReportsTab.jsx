import { useState, useEffect } from 'react';
import { Flag, User, Calendar, AlertTriangle, CheckCircle, XCircle, RefreshCw, X } from 'lucide-react';
import AdminService from '../../services/adminService';

const ReportsTab = ({ onRefresh }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('pending');
  const [processingReport, setProcessingReport] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadReports();
  }, [status]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await AdminService.getReports(1, 20, status);
      
      if (result.success) {
        setReports(result.data.reports || []);
      } else {
        setError(result.error || 'Fehler beim Laden der Reports');
      }
    } catch (error) {
      setError('Fehler beim Laden der Reports');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessReport = async (reportId, actionData) => {
    try {
      setProcessingReport(reportId);
      
      const result = await AdminService.processReport(reportId, actionData);
      
      if (result.success) {
        // Report aus Liste entfernen wenn resolved/dismissed
        setReports(prev => prev.filter(r => r.id !== reportId));
        setShowProcessModal(false);
        setSelectedReport(null);
        
        // Optional: Refresh callback aufrufen
        if (onRefresh) {
          onRefresh();
        }
      } else {
        alert(result.error || 'Fehler beim Verarbeiten des Reports');
      }
    } catch (error) {
      alert('Fehler beim Verarbeiten des Reports');
    } finally {
      setProcessingReport(null);
    }
  };

  const getReasonIcon = (reason) => {
    const icons = {
      spam: '🚫',
      harassment: '😠',
      hate_speech: '💢',
      inappropriate_content: '⚠️',
      misinformation: '❌',
      copyright: '©️',
      other: '❓'
    };
    return icons[reason] || '❓';
  };

  const getReasonLabel = (reason) => {
    const labels = {
      spam: 'Spam',
      harassment: 'Belästigung',
      hate_speech: 'Hassrede',
      inappropriate_content: 'Unangemessene Inhalte',
      misinformation: 'Falschinformationen',
      copyright: 'Urheberrecht',
      other: 'Anderer Grund'
    };
    return labels[reason] || reason;
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl font-bold text-primary dark:text-white">Reports & Meldungen</h2>
          <button
            onClick={loadReports}
            disabled={loading}
            className="p-2 text-secondary hover:text-primary hover:bg-hover rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="pending">Ausstehend ({reports.filter(r => r.status === 'pending').length})</option>
          <option value="resolved">Bearbeitet</option>
          <option value="dismissed">Abgelehnt</option>
        </select>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Reports List */}
      {!loading && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-card dark:bg-gray-800 border border-primary dark:border-gray-700 rounded-lg text-center py-12">
              <Flag size={48} className="mx-auto mb-4 text-tertiary dark:text-muted opacity-50" />
              <p className="text-secondary dark:text-muted">
                {status === 'pending' ? 'Keine ausstehenden Reports' : `Keine ${status} Reports gefunden`}
              </p>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="bg-card dark:bg-gray-800 border border-primary dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{getReasonIcon(report.reason)}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Flag size={16} className="text-red-500" />
                        <span className="font-semibold text-primary dark:text-white">
                          {report.reportedContentType.toUpperCase()} Report
                        </span>
                        <span className={`px-2 py-1 text-xs rounded font-medium ${
                          report.status === 'pending' 
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            : report.status === 'resolved'
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <p>
                            <span className="font-medium text-primary dark:text-white">Grund:</span>{' '}
                            <span className="text-secondary dark:text-muted">{getReasonLabel(report.reason)}</span>
                          </p>
                          <p>
                            <span className="font-medium text-primary dark:text-white">Gemeldet von:</span>{' '}
                            <span className="text-secondary dark:text-muted">@{report.reporter?.username || 'Unbekannt'}</span>
                          </p>
                          {report.reportedUser && (
                            <p>
                              <span className="font-medium text-primary dark:text-white">Betroffener User:</span>{' '}
                              <span className="text-secondary dark:text-muted">@{report.reportedUser.username}</span>
                            </p>
                          )}
                          <p>
                            <span className="font-medium text-primary dark:text-white">Datum:</span>{' '}
                            <span className="text-secondary dark:text-muted">{new Date(report.createdAt).toLocaleDateString('de-DE')}</span>
                          </p>
                        </div>
                        
                        {report.description && (
                          <p className="mt-2 p-3 bg-secondary dark:bg-gray-700 rounded text-sm">
                            <span className="font-medium text-primary dark:text-white">Beschreibung:</span>{' '}
                            <span className="text-secondary dark:text-muted">{report.description}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-tertiary dark:text-muted">
                    {new Date(report.createdAt).toLocaleDateString('de-DE')}
                  </div>
                </div>
                
                {/* Action Buttons */}
                {report.status === 'pending' && (
                  <div className="flex space-x-2 pt-4 border-t border-secondary dark:border-gray-700">
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setShowProcessModal(true);
                      }}
                      disabled={processingReport === report.id}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:cursor-pointer transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => handleProcessReport(report.id, { action: 'dismiss' })}
                      disabled={processingReport === report.id}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 hover:cursor-pointer transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      Ablehnen
                    </button>
                  </div>
                )}

                {/* Resolution Info */}
                {report.status !== 'pending' && (
                  <div className="pt-4 border-t border-secondary dark:border-gray-700">
                    <div className="flex items-center space-x-2 text-sm">
                      {report.status === 'resolved' ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <XCircle size={16} className="text-gray-600" />
                      )}
                      <span className="text-secondary dark:text-muted">
                        {report.status === 'resolved' ? 'Bearbeitet' : 'Abgelehnt'} von {report.reviewer?.username || 'System'}
                        {report.reviewedAt && ` am ${new Date(report.reviewedAt).toLocaleDateString('de-DE')}`}
                      </span>
                    </div>
                    {report.actionTaken && (
                      <p className="text-sm text-secondary dark:text-muted mt-1">
                        <span className="font-medium">Maßnahmen:</span> {report.actionTaken}
                      </p>
                    )}
                    {report.resolution && (
                      <p className="text-sm text-secondary dark:text-muted mt-1">
                        <span className="font-medium">Begründung:</span> {report.resolution}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Process Report Modal */}
      {showProcessModal && selectedReport && (
        <ProcessReportModal
          report={selectedReport}
          onClose={() => {
            setShowProcessModal(false);
            setSelectedReport(null);
          }}
          onProcess={handleProcessReport}
          processing={processingReport === selectedReport.id}
        />
      )}
    </div>
  );
};

// Process Report Modal Component (unverändert wie vorher)
const ProcessReportModal = ({ report, onClose, onProcess, processing }) => {
  const [actionData, setActionData] = useState({
    action: 'resolve',
    resolution: '',
    contentAction: 'none',
    userAction: 'none',
    timeoutDuration: 24
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onProcess(report.id, actionData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-secondary dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary dark:text-white">Report bearbeiten</h3>
          <button
            onClick={onClose}
            disabled={processing}
            className="text-muted hover:text-secondary hover:cursor-pointer transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Report Info */}
          <div className="bg-secondary dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-primary dark:text-white mb-2">Report Details</h4>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Grund:</span> {report.reason}</p>
              <p><span className="font-medium">Von:</span> @{report.reporter?.username}</p>
              {report.reportedUser && (
                <p><span className="font-medium">Betroffener User:</span> @{report.reportedUser.username}</p>
              )}
              {report.description && (
                <p><span className="font-medium">Beschreibung:</span> {report.description}</p>
              )}
            </div>
          </div>

          {/* Action */}
          <div>
            <label className="block text-sm font-medium text-secondary dark:text-muted mb-2">
              Aktion
            </label>
            <select
              value={actionData.action}
              onChange={(e) => setActionData(prev => ({ ...prev, action: e.target.value }))}
              className="w-full px-3 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="resolve">Bearbeiten (Resolve)</option>
              <option value="dismiss">Ablehnen (Dismiss)</option>
              <option value="escalate">Eskalieren</option>
            </select>
          </div>

          {/* Content Action */}
          <div>
            <label className="block text-sm font-medium text-secondary dark:text-muted mb-2">
              Aktion für gemeldeten Inhalt
            </label>
            <select
              value={actionData.contentAction}
              onChange={(e) => setActionData(prev => ({ ...prev, contentAction: e.target.value }))}
              className="w-full px-3 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">Keine Aktion</option>
              <option value="hide">Ausblenden</option>
              <option value="delete">Löschen</option>
            </select>
          </div>

          {/* User Action */}
          {report.reportedUser && (
            <div>
              <label className="block text-sm font-medium text-secondary dark:text-muted mb-2">
                Aktion für User
              </label>
              <select
                value={actionData.userAction}
                onChange={(e) => setActionData(prev => ({ ...prev, userAction: e.target.value }))}
                className="w-full px-3 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">Keine Aktion</option>
                <option value="warning">Verwarnung</option>
                <option value="timeout">Timeout</option>
                <option value="ban">Ban</option>
              </select>

              {actionData.userAction === 'timeout' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-secondary dark:text-muted mb-2">
                    Timeout Dauer (Stunden)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8760"
                    value={actionData.timeoutDuration}
                    onChange={(e) => setActionData(prev => ({ ...prev, timeoutDuration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Resolution */}
          <div>
            <label className="block text-sm font-medium text-secondary dark:text-muted mb-2">
              Begründung (optional)
            </label>
            <textarea
              value={actionData.resolution}
              onChange={(e) => setActionData(prev => ({ ...prev, resolution: e.target.value }))}
              placeholder="Begründung für die Entscheidung..."
              rows={3}
              className="w-full px-3 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="flex-1 px-4 py-2 border border-secondary dark:border-gray-600 text-secondary dark:text-muted rounded-lg hover:bg-secondary dark:hover:bg-gray-700 hover:cursor-pointer transition-colors disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={processing}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:cursor-pointer transition-colors disabled:opacity-50"
            >
              {processing ? 'Verarbeite...' : 'Ausführen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportsTab;