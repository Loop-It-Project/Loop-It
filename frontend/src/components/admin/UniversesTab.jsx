import { useState, useEffect } from 'react';
import { Search, Globe } from 'lucide-react';
import AdminService from '../../services/adminService';
import TransferOwnershipModal from './modals/TransferOwnershipModal';

const UniversesTab = () => {
  const [universes, setUniverses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedUniverse, setSelectedUniverse] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Load Universes
  const loadUniverses = async () => {
    console.log('🔍 UniversesTab: Loading universes...');
    setLoading(true);
    setError('');
    
    try {
      const result = await AdminService.getAllUniverses(currentPage, 20, search, statusFilter);
      console.log('🔍 UniversesTab: AdminService result:', result);
      
      if (result.success) {
        console.log('✅ UniversesTab: Universes loaded:', result.data.universes);
        setUniverses(result.data.universes || []);
        setTotalCount(result.data.pagination?.total || 0);
      } else {
        console.error('❌ UniversesTab: Failed to load universes:', result.error);
        setError(result.error || 'Fehler beim Laden der Universes');
      }
    } catch (error) {
      console.error('❌ UniversesTab: Error loading universes:', error);
      setError('Netzwerkfehler beim Laden der Universes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUniverses();
  }, [currentPage, search, statusFilter]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadUniverses();
    }, 500);

    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  // Actions
  const handleToggleStatus = async (universe, isClosed) => {
    setActionLoading(true);
    try {
      const result = await AdminService.toggleUniverseStatus(universe.id, isClosed);
      if (result.success) {
        loadUniverses();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (universe, isActive) => {
    setActionLoading(true);
    try {
      const result = await AdminService.toggleUniverseActive(universe.id, isActive);
      if (result.success) {
        loadUniverses();
      }
    } catch (error) {
      console.error('Error toggling active:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUniverse = async (universe) => {
    if (!confirm(`Bist du sicher, dass du "${universe.name}" löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await AdminService.deleteUniverse(universe.id);
      if (result.success) {
        loadUniverses();
      }
    } catch (error) {
      console.error('Error deleting universe:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (universe) => {
    if (universe.isDeleted) {
      return <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded-full">Gelöscht</span>;
    }
    if (universe.isClosed) {
      return <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded-full">Geschlossen</span>;
    }
    if (!universe.isActive) {
      return <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs rounded-full">Inaktiv</span>;
    }
    return <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">Aktiv</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-primary dark:text-white">Universe Management</h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary dark:text-muted" />
            <input
              type="text"
              placeholder="Universes suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
            />
          </div>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Alle Status</option>
            <option value="active">Aktiv</option>
            <option value="inactive">Inaktiv</option>
            <option value="closed">Geschlossen</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card dark:bg-gray-800 border border-primary dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-primary dark:text-white">{totalCount}</div>
          <div className="text-sm text-secondary dark:text-muted">Gesamt Universes</div>
        </div>
        <div className="bg-card dark:bg-gray-800 border border-primary dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{universes.filter(u => u.isActive && !u.isClosed).length}</div>
          <div className="text-sm text-secondary dark:text-muted">Aktive</div>
        </div>
        <div className="bg-card dark:bg-gray-800 border border-primary dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">{universes.filter(u => u.isClosed).length}</div>
          <div className="text-sm text-secondary dark:text-muted">Geschlossen</div>
        </div>
        <div className="bg-card dark:bg-gray-800 border border-primary dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{universes.filter(u => !u.isActive).length}</div>
          <div className="text-sm text-secondary dark:text-muted">Inaktive</div>
        </div>
      </div>

      {/* Universes Table */}
      <div className="bg-card dark:bg-gray-800 border border-primary dark:border-gray-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-secondary dark:text-muted">Lade Universes...</p>
          </div>
        ) : universes.length === 0 ? (
          <div className="text-center py-12">
            <Globe size={48} className="mx-auto mb-4 text-tertiary dark:text-muted opacity-50" />
            <p className="text-secondary dark:text-muted">Keine Universes gefunden</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-hover dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary dark:text-gray-300 uppercase tracking-wider">Universe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary dark:text-gray-300 uppercase tracking-wider">Besitzer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary dark:text-gray-300 uppercase tracking-wider">Mitglieder</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary dark:text-gray-300 uppercase tracking-wider">Posts</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary dark:text-gray-300 uppercase tracking-wider">Erstellt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary dark:text-gray-300 uppercase tracking-wider">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {universes.map((universe) => (
                  <tr key={universe.id} className="hover:bg-hover dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-primary dark:text-white">
                          {universe.name}
                        </div>
                        <div className="text-sm text-secondary dark:text-muted">
                          /{universe.slug}
                        </div>
                        {universe.description && (
                          <div className="text-xs text-tertiary dark:text-gray-400 mt-1 max-w-xs truncate">
                            {universe.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-primary dark:text-white">
                        {universe.creatorDisplayName || universe.creatorUsername || 'Unbekannt'}
                      </div>
                      <div className="text-sm text-secondary dark:text-muted">
                        @{universe.creatorUsername || 'unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(universe)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary dark:text-muted">
                      {universe.memberCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary dark:text-muted">
                      {universe.postCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary dark:text-muted">
                      {new Date(universe.createdAt).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {/* Toggle Active/Inactive */}
                        <button
                          onClick={() => handleToggleActive(universe, !universe.isActive)}
                          disabled={actionLoading}
                          className={`px-2 py-1 text-xs rounded ${
                            universe.isActive 
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                          } hover:cursor-pointer transition-colors disabled:opacity-50`}
                        >
                          {universe.isActive ? 'Deaktivieren' : 'Aktivieren'}
                        </button>

                        {/* Toggle Open/Close */}
                        {universe.isActive && (
                          <button
                            onClick={() => handleToggleStatus(universe, !universe.isClosed)}
                            disabled={actionLoading}
                            className={`px-2 py-1 text-xs rounded ${
                              universe.isClosed 
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                                : 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-800'
                            } hover:cursor-pointer transition-colors disabled:opacity-50`}
                          >
                            {universe.isClosed ? 'Öffnen' : 'Schließen'}
                          </button>
                        )}

                        {/* Transfer Ownership */}
                        <button
                          onClick={() => {
                            setSelectedUniverse(universe);
                            setShowTransferModal(true);
                          }}
                          disabled={actionLoading}
                          className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 hover:cursor-pointer transition-colors disabled:opacity-50"
                        >
                          Übertragen
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteUniverse(universe)}
                          disabled={actionLoading}
                          className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 hover:cursor-pointer transition-colors disabled:opacity-50"
                        >
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {universes.length > 0 && (
          <div className="bg-secondary dark:bg-gray-700 px-4 py-3 flex items-center justify-between border-t border-primary dark:border-gray-600 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-primary dark:border-gray-600 text-sm font-medium rounded-md text-tertiary dark:text-muted bg-card dark:bg-gray-800 hover:bg-hover dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Zurück
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={universes.length < 20}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-primary dark:border-gray-600 text-sm font-medium rounded-md text-tertiary dark:text-muted bg-card dark:bg-gray-800 hover:bg-hover dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Weiter
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-tertiary dark:text-muted">
                  Zeige <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> bis{' '}
                  <span className="font-medium">{Math.min(currentPage * 20, totalCount)}</span> von{' '}
                  <span className="font-medium">{totalCount}</span> Ergebnissen
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-primary dark:border-gray-600 bg-card dark:bg-gray-800 text-sm font-medium text-tertiary dark:text-muted hover:bg-hover dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Zurück
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={universes.length < 20}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-primary dark:border-gray-600 bg-card dark:bg-gray-800 text-sm font-medium text-tertiary dark:text-muted hover:bg-hover dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Weiter
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transfer Ownership Modal */}
      <TransferOwnershipModal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setSelectedUniverse(null);
        }}
        universe={selectedUniverse}
        onTransfer={loadUniverses}
      />
    </div>
  );
};

export default UniversesTab;