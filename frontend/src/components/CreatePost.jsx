import { useState, } from 'react';
import { X, Hash, Image, MapPin } from 'lucide-react';
import FeedService from '../services/feedServices';
import useEscapeKey from '../hooks/useEscapeKey';

const CreatePost = ({ onClose, onPostCreated, userUniverses }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    universeId: '',
    hashtags: '',
    isPublic: true
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Close modal on Escape key press
  useEscapeKey(() => onClose(), true);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      setErrors({ content: 'Post-Inhalt ist erforderlich' });
      return;
    }
    
    if (!formData.universeId) {
      setErrors({ universeId: 'Bitte wähle ein Universe aus' });
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement createPost in FeedService
      const postData = {
        ...formData,
        hashtags: formData.hashtags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      const response = await FeedService.createPost(postData);
      
      if (response.success) {
        onPostCreated(response.data);
        onClose();
      } else {
        setErrors({ submit: response.error || 'Fehler beim Erstellen des Posts' });
      }
    } catch (error) {
      console.error('Create post error:', error);
      setErrors({ submit: 'Fehler beim Erstellen des Posts' });
    } finally {
      setLoading(false);
    }
  };

  // Filtere nur verfügbare Universes für Posts
  const availableUniverses = userUniverses?.filter(universe => {
    // Nur aktive, offene und nicht gelöschte Universes
    return universe.isActive !== false && 
           universe.isClosed !== true && 
           universe.isDeleted !== true;
  }) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-primary flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary">Neuen Post erstellen</h2>
          <button onClick={onClose} className="text-muted hover:text-secondary hover:cursor-pointer transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Universe Selection */}
          <div>
            <label className="block text-sm font-medium text-primary dark:text-white mb-1">
              Universe auswählen *
            </label>
            {loadingUniverses ? (
              <div className="text-sm text-tertiary">Lade Universes...</div>
            ) : (
              <>
                <select
                  value={formData.universeId}
                  onChange={(e) => setFormData(prev => ({ ...prev, universeId: e.target.value }))}
                  className="w-full px-3 py-2 border border-secondary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Universe wählen...</option>
                  {userUniverses.map((universe) => (
                    <option key={universe.id} value={universe.id}>
                      {universe.slug} ({universe.memberCount} Mitglieder)
                    </option>
                  ))}
                </select>
                
                {/* WARNUNGEN FÜR NICHT VERFÜGBARE UNIVERSES */}
                {userUniverses.length === 0 && allUserUniverses.length > 0 && (
                  <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-700 rounded-lg">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      ⚠️ Alle deine Universes ({allUserUniverses.length}) sind derzeit geschlossen oder inaktiv. Du kannst momentan keine Posts erstellen.
                    </p>
                  </div>
                )}

                {allUserUniverses.length === 0 && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      ℹ️ Du bist noch keinem Universe beigetreten. Tritt einem Universe bei, um Posts zu erstellen.
                    </p>
                  </div>
                )}

                {userUniverses.length > 0 && allUserUniverses.length > userUniverses.length && (
                  <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ℹ️ {userUniverses.length} von {allUserUniverses.length} Universes sind verfügbar. {allUserUniverses.length - userUniverses.length} sind geschlossen/inaktiv.
                    </p>
                  </div>
                )}
              </>
            )}
            {errors.universeId && <p className="text-red-500 text-sm mt-1">{errors.universeId}</p>}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              Titel (optional)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-secondary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Was möchtest du teilen?"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              Inhalt *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-secondary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Teile deine Gedanken, Erfahrungen oder Fragen..."
            />
            {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              Hashtags (optional)
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={16} />
              <input
                type="text"
                value={formData.hashtags}
                onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-secondary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="gaming, react, fotografie (durch Komma getrennt)"
              />
            </div>
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-primary">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-secondary bg-hover rounded-lg hover:bg-tertiary hover:cursor-pointer transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={
                loading || 
                isCreatingPost || 
                !formData.content.trim() || 
                !formData.universeId ||
                userUniverses.length === 0
              }
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} className={isCreatingPost ? 'animate-pulse' : ''} />
              <span>
                {userUniverses.length === 0 ? 'Keine Universes verfügbar' :
                 isCreatingPost ? 'Wird gepostet...' : 
                 loading ? 'Erstelle...' : 'Posten'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;