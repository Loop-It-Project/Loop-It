import { useState } from 'react';
import AdminService from '../../../services/adminService';

const TransferOwnershipModal = ({ isOpen, onClose, universe, onTransfer }) => {
  const [newOwnerId, setNewOwnerId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    if (!newOwnerId || !universe) return;
    
    setLoading(true);
    try {
      const result = await AdminService.transferUniverseOwnership(universe.id, newOwnerId);
      if (result.success) {
        onClose();
        setNewOwnerId('');
        onTransfer();
      }
    } catch (error) {
      console.error('Error transferring ownership:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card dark:bg-gray-800 rounded-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-bold text-primary dark:text-white mb-4">
            Eigentümerschaft übertragen
          </h3>
          <p className="text-secondary dark:text-muted mb-4">
            Übertrage die Eigentümerschaft von "{universe?.name}" an einen anderen Benutzer.
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-primary dark:text-white mb-2">
              Neue Benutzer-ID
            </label>
            <input
              type="text"
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
              placeholder="User-ID eingeben..."
              className="w-full px-3 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                onClose();
                setNewOwnerId('');
              }}
              className="px-4 py-2 text-secondary dark:text-muted bg-hover dark:bg-gray-700 rounded-lg hover:bg-tertiary dark:hover:bg-gray-600 hover:cursor-pointer transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleTransfer}
              disabled={!newOwnerId || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:cursor-pointer disabled:opacity-50 transition-colors"
            >
              {loading ? 'Übertrage...' : 'Übertragen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferOwnershipModal;