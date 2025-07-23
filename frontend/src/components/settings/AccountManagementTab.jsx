import { useState } from 'react';
import { AlertTriangle, Shield, Trash2, Eye, ArrowLeft } from 'lucide-react';
import AccountService from '../../services/accountService';

const AccountManagementTab = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showDeletionImpact, setShowDeletionImpact] = useState(false);
  const [deletionImpact, setDeletionImpact] = useState(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const loadDeletionImpact = async () => {
    try {
      setLoading(true);
      const result = await AccountService.getDeletionImpactReport();
      
      if (result.success) {
        setDeletionImpact(result.data);
        setShowDeletionImpact(true);
      } else {
        setError(result.error || 'Failed to load deletion impact report');
      }
    } catch (error) {
      setError('Network error loading deletion impact report');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const result = await AccountService.deactivateAccount(deactivateReason);

      if (result.success) {
        setMessage('Account deactivated successfully. You will be logged out.');
        setTimeout(() => {
          onLogout('account_deactivated');
        }, 2000);
      } else {
        setError(result.error || 'Failed to deactivate account');
      }
    } catch (error) {
      setError('Network error deactivating account');
    } finally {
      setLoading(false);
      setShowDeactivateModal(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const result = await AccountService.deleteAccount(confirmPassword, deleteReason);

      if (result.success) {
        setMessage('Account deleted successfully. You will be logged out.');
        setTimeout(() => {
          onLogout('account_deleted');
        }, 2000);
      } else {
        setError(result.error || 'Failed to delete account');
      }
    } catch (error) {
      setError('Network error deleting account');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const DeactivateModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-primary rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="text-yellow-500" size={24} />
            <h2 className="text-xl font-bold text-primary">Account deaktivieren</h2>
          </div>
          
          <div className="mb-4">
            <p className="text-secondary mb-4">
              Dein Account wird deaktiviert. Du kannst ihn später reaktivieren.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-yellow-800 mb-2">Was passiert bei der Deaktivierung:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Dein Profil wird auf privat gesetzt</li>
                <li>• Deine Posts werden ausgeblendet</li>
                <li>• Du wirst aus allen Universes entfernt</li>
                <li>• Deine Daten bleiben erhalten</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Grund (optional)
              </label>
              <textarea
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="Warum möchtest du deinen Account deaktivieren?"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeactivateModal(false)}
              className="px-4 py-2 text-secondary border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              onClick={handleDeactivateAccount}
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg cursor-pointer hover:bg-yellow-700 disabled:opacity-50"
            >
              {loading ? 'Deaktiviere...' : 'Account deaktivieren'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const DeleteModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-primary rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Trash2 className="text-red-500" size={24} />
            <h2 className="text-xl font-bold cursor-pointer cursor-pointer text-primary">Account löschen</h2>
          </div>
          
          <div className="mb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-red-800 mb-2">⚠️ Warnung - Diese Aktion ist unwiderruflich!</h4>
              <p className="text-sm text-red-700">
                Alle deine Daten werden permanent gelöscht und können nicht wiederhergestellt werden.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary mb-2">
                Grund (optional)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Warum möchtest du deinen Account löschen?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Passwort bestätigen *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Dein aktuelles Passwort"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-secondary border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={loading || !confirmPassword}
              className="px-4 py-2 bg-red-600 text-white rounded-lg cursor-pointer hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Lösche...' : 'Account permanent löschen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const DeletionImpactModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-primary rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Eye className="text-blue-500" size={24} />
              <h2 className="text-xl font-bold text-primary">Löschungsauswirkungen</h2>
            </div>
            <button
              onClick={() => setShowDeletionImpact(false)}
              className="text-primary cursor-pointer hover:text-tertiary"
            >
              <ArrowLeft size={20} />
            </button>
          </div>
          
          {deletionImpact && (
            <div className="space-y-4">
              <p className="text-secondary mb-4">
                Folgende Daten werden bei der Kontolöschung entfernt:
              </p>
              
              <div className="bg-card rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-primary">{deletionImpact.posts}</div>
                    <div className="text-sm text-secondary">Posts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{deletionImpact.comments}</div>
                    <div className="text-sm text-secondary">Kommentare</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{deletionImpact.universes}</div>
                    <div className="text-sm text-secondary">Universes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{deletionImpact.friends}</div>
                    <div className="text-sm text-secondary">Freunde</div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">
                  Diese Aktion ist unwiderruflich. Alle deine Daten werden permanent gelöscht.
                </p>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowDeletionImpact(false)}
              className="px-4 py-2 text-secondary border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
            >
              Schließen
            </button>
            <button
              onClick={() => {
                setShowDeletionImpact(false);
                setShowDeleteModal(true);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg cursor-pointer hover:bg-red-700"
            >
              Trotzdem löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Shield className="text-blue-500" size={24} />
        <h2 className="text-xl font-semibold text-primary">Account Management</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          {message}
        </div>
      )}

      {/* Account Deactivation */}
      <div className="bg-card border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="text-yellow-500" size={20} />
          <h3 className="text-lg font-semibold text-primary">Account deaktivieren</h3>
        </div>
        
        <p className="text-tertiary mb-4">
          Deaktiviere deinen Account temporär. Du kannst ihn später wieder aktivieren.
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-yellow-800 mb-2">Was passiert bei der Deaktivierung:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Dein Profil wird auf privat gesetzt</li>
            <li>• Deine Posts werden ausgeblendet</li>
            <li>• Du wirst aus allen Universes entfernt</li>
            <li>• Deine Daten bleiben erhalten</li>
          </ul>
        </div>

        <button
          onClick={() => setShowDeactivateModal(true)}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg cursor-pointer hover:bg-yellow-700 transition-colors"
        >
          Account deaktivieren
        </button>
      </div>

      {/* Account Deletion */}
      <div className="bg-card border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Trash2 className="text-red-500" size={20} />
          <h3 className="text-lg font-semibold text-primary">Account löschen</h3>
        </div>
        
        <p className="text-tertiary mb-4">
          Lösche deinen Account permanent. Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-red-800 mb-2">⚠️ Warnung:</h4>
          <p className="text-sm text-red-700">
            Alle deine Daten werden permanent gelöscht und können nicht wiederhergestellt werden.
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={loadDeletionImpact}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Lade...' : 'Auswirkungen anzeigen'}
          </button>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg cursor-pointer hover:bg-red-700 transition-colors"
          >
            Account löschen
          </button>
        </div>
      </div>

      {/* Modals */}
      {showDeactivateModal && <DeactivateModal />}
      {showDeleteModal && <DeleteModal />}
      {showDeletionImpact && <DeletionImpactModal />}
    </div>
  );
};

export default AccountManagementTab;