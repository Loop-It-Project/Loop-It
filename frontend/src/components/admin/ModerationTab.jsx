import { Flag } from 'lucide-react';

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

export default ModerationTab;