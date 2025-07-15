import { useState, useEffect } from 'react';
import { Image, Hash, Globe, Lock, Send, X } from 'lucide-react';
import FeedService from '../../services/feedServices';
import UniverseService from '../../services/universeService';
import useEscapeKey from '../../hooks/useEscapeKey';
import MediaUpload from '../MediaUpload';

const PostComposer = ({ onPostCreated, onFeedReload, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    universeId: '',
    hashtags: '',
    isPublic: true,
    mediaIds: []
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [userUniverses, setUserUniverses] = useState([]);
  const [loadingUniverses, setLoadingUniverses] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [allUserUniverses, setAllUserUniverses] = useState([]);
  const [uploadedMedia, setUploadedMedia] = useState([]); // ← Korrekte Variable

  // Close modal on Escape key press
  useEscapeKey(() => {
    if (isExpanded) {
      setIsExpanded(false);
      setErrors({});
    }
  }, isExpanded);

  // Lade User's Universes
  useEffect(() => {
    const loadUserUniverses = async () => {
      try {
        const [ownedResponse, memberResponse] = await Promise.all([
          UniverseService.getOwnedUniverses(),
          UniverseService.getUserUniverses(1, 50)
        ]);

        const allUniverses = [];
        
        if (ownedResponse.success) {
          allUniverses.push(...ownedResponse.data.universes);
        }
        
        if (memberResponse.success) {
          const ownedIds = new Set(allUniverses.map(u => u.id));
          const memberUniverses = memberResponse.data.universes.filter(u => !ownedIds.has(u.id));
          allUniverses.push(...memberUniverses);
        }

        setAllUserUniverses(allUniverses);

        const availableUniverses = allUniverses.filter(universe => {
          return universe.isActive !== false && 
                 universe.isClosed !== true && 
                 universe.isDeleted !== true;
        });

        setUserUniverses(availableUniverses);
      } catch (error) {
        console.error('Error loading universes:', error);
      } finally {
        setLoadingUniverses(false);
      }
    };

    loadUserUniverses();
  }, []);

  // Handle media upload
  const handleMediaUploaded = (newMedia) => {
    try {
      console.log('📸 PostComposer: Media uploaded:', newMedia);
      
      const mediaIds = Array.isArray(newMedia) ? newMedia.map(media => media.id) : [newMedia.id];
      
      // DEBUGGING: Erweiterte Logs
      console.log('📸 PostComposer: Processing media IDs:', mediaIds);
      console.log('📸 PostComposer: Current form mediaIds:', formData.mediaIds);
      console.log('📸 PostComposer: Current uploaded media:', uploadedMedia);
      
      // State aktualisieren
      setFormData(prev => ({
        ...prev,
        mediaIds: [...prev.mediaIds, ...mediaIds]
      }));
      
      // Uploaded media für UI tracking
      setUploadedMedia(prev => [...prev, ...(Array.isArray(newMedia) ? newMedia : [newMedia])]);
      
      console.log('✅ PostComposer: Media IDs updated:', mediaIds);
      console.log('✅ PostComposer: New form data will be:', {
        ...formData,
        mediaIds: [...formData.mediaIds, ...mediaIds]
      });
      
    } catch (error) {
      console.error('❌ PostComposer: Error handling media upload:', error);
      setErrors(prev => ({ ...prev, media: 'Error uploading media' }));
    }
  };

  // Handle media removal
  const handleMediaRemoved = (mediaId) => {
    console.log('🗑️ PostComposer: Removing media:', mediaId);
    
    setFormData(prev => ({
      ...prev,
      mediaIds: prev.mediaIds.filter(id => id !== mediaId)
    }));
    
    setUploadedMedia(prev => prev.filter(media => media.id !== mediaId));
    
    console.log('✅ PostComposer: Media removed, new mediaIds:', formData.mediaIds.filter(id => id !== mediaId));
  };

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
    setIsCreatingPost(true);

    try {
      const postData = {
        ...formData,
        hashtags: formData.hashtags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      // DEBUGGING: Erweiterte Logs für Post-Creation
      console.log('📸 PostComposer: Submitting post with data:', {
        ...postData,
        mediaIdsCount: postData.mediaIds.length,
        uploadedMediaCount: uploadedMedia.length,
        mediaIds: postData.mediaIds,
        uploadedMedia: uploadedMedia
      });
      
      const response = await FeedService.createPost(postData);
      
      // DEBUGGING: Response analysieren
      console.log('📸 PostComposer: Post creation response:', {
        success: response.success,
        hasData: !!response.data,
        postId: response.data?.id,
        mediaInResponse: response.data?.media,
        mediaCount: response.data?.media?.length || 0,
        error: response.error
      });
      
      if (response.success) {
        // Form zurücksetzen
        setFormData({
          title: '',
          content: '',
          universeId: '',
          hashtags: '',
          isPublic: true,
          mediaIds: []
        });
        setUploadedMedia([]);
        setIsExpanded(false);
        setErrors({});

        // DEBUGGING
        console.log('Available handlers:', {
          onFeedReload: !!onFeedReload,
          onPostCreated: !!onPostCreated
        });

        // Feed-Reload (empfohlen)
        if (onFeedReload) {
          console.log('🔄 PostComposer: Starting feed reload...');
          await onFeedReload();
          console.log('✅ PostComposer: Feed reload completed');
        }
        // Fallback - Post manuell hinzufügen
        else if (onPostCreated) {
          console.log('⚠️ PostComposer: Fallback - manually adding post');
          onPostCreated(response.data);
        } else {
          console.error('❌ PostComposer: No handlers available!');
        }

      } else {
        setErrors({ submit: response.error || 'Fehler beim Erstellen des Posts' });
      }
    } catch (error) {
      console.error('❌ PostComposer: Create post error:', error);
      setErrors({ submit: 'Fehler beim Erstellen des Posts' });
    } finally {
      setLoading(false);
      setIsCreatingPost(false);
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-primary p-4 mb-6">
      {/* Compact View */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full text-left p-3 border border-secondary rounded-lg text-tertiary hover:border-purple-300 hover:text-purple-600 hover:cursor-pointer transition-colors"
        >
          Was möchtest du teilen?
        </button>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-primary">Neuen Post erstellen</h3>
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                setErrors({});
                setUploadedMedia([]); // ← Korrekte Variable
              }}
              className="text-muted hover:text-secondary hover:cursor-pointer transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Universe Selection */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              Universe auswählen *
            </label>
            {loadingUniverses ? (
              <div className="text-sm text-tertiary">Lade Universes...</div>
            ) : (
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
            )}
            {errors.universeId && <p className="text-red-500 text-sm mt-1">{errors.universeId}</p>}
          </div>

          {/* Title */}
          <div>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-secondary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Titel (optional)..."
            />
          </div>

          {/* Content */}
          <div>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-secondary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              placeholder="Was möchtest du teilen? Teile deine Gedanken, Erfahrungen oder stelle eine Frage..."
            />
            {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
          </div>

          {/* Hashtags */}
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={16} />
            <input
              type="text"
              value={formData.hashtags}
              onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
              className="w-full pl-10 pr-3 py-2 border border-secondary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Hashtags (durch Komma getrennt)"
            />
          </div>

          {/* Media Upload */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Bilder hinzufügen (optional)
            </label>
            <MediaUpload
              onMediaUploaded={handleMediaUploaded}
              onMediaRemoved={handleMediaRemoved}
              maxFiles={5}
              type="post"
            />
            {errors.media && <p className="text-red-500 text-sm mt-1">{errors.media}</p>}
          </div>

          {/* Privacy & Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-primary">
            <div className="flex items-center space-x-4">
              {/* Privacy Toggle */}
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <Globe size={16} className={formData.isPublic ? 'text-green-500' : 'text-muted'} />
                <span className="text-secondary">Öffentlich</span>
              </label>

              {/* Media Count Display */}
              {uploadedMedia.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-secondary">
                  <Image size={16} />
                  <span>{uploadedMedia.length} Bild{uploadedMedia.length > 1 ? 'er' : ''}</span>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setUploadedMedia([]); // ← Korrekte Variable
                }}
                className="px-4 py-2 text-secondary hover:text-primary hover:cursor-pointer transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading || isCreatingPost || !formData.content.trim() || !formData.universeId}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} className={isCreatingPost ? 'animate-pulse' : ''} />
                <span>
                  {isCreatingPost ? 'Wird gepostet...' : loading ? 'Erstelle...' : 'Posten'}
                </span>
              </button>
            </div>
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default PostComposer;