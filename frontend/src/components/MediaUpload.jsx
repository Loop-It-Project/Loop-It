import { useState, useRef } from 'react';
import { Image, X, Upload, Loader } from 'lucide-react';
import MediaService from '../services/mediaService';

const MediaUpload = ({ onMediaUploaded, onMediaRemoved, maxFiles = 5, type = 'post' }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;

    // Validate file count
    if (uploadedMedia.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setError('Only JPEG, PNG, GIF, and WebP images are allowed');
      return;
    }

    // Validate file sizes
    const maxSize = type === 'profile' ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for profile, 10MB for posts
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setError(`Files must be smaller than ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    setError('');
    setUploading(true);

    try {
      console.log('📤 MediaUpload: Starting upload...', { files: files.length, type });
      
      let result;
      
      if (type === 'profile') {
        result = await MediaService.uploadProfileImage(files[0]);
      } else {
        result = await MediaService.uploadPostImages(files);
      }

      console.log('📥 MediaUpload: Upload result:', result);

      if (result.success) {
        const newMedia = Array.isArray(result.data) ? result.data : [result.data];
        setUploadedMedia(prev => [...prev, ...newMedia]);
        
        if (onMediaUploaded) {
          onMediaUploaded(newMedia);
        }
        
        console.log('✅ MediaUpload: Upload successful');
      } else {
        console.error('❌ MediaUpload: Upload failed:', result.error);
        setError(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ MediaUpload: Network error:', error);
      setError('Upload failed');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveMedia = async (mediaId) => {
    try {
      console.log('🗑️ MediaUpload: Removing media:', mediaId);
      
      const result = await MediaService.deleteMedia(mediaId);
      
      if (result.success) {
        setUploadedMedia(prev => prev.filter(media => media.id !== mediaId));
        
        if (onMediaRemoved) {
          onMediaRemoved(mediaId);
        }
        
        console.log('✅ MediaUpload: Media removed successfully');
      } else {
        console.error('❌ MediaUpload: Remove failed:', result.error);
        setError('Failed to remove media');
      }
    } catch (error) {
      console.error('❌ MediaUpload: Remove error:', error);
      setError('Failed to remove media');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center space-x-3">
        <button
          type="button" // ← Wichtig: Verhindert Form-Submit
          onClick={triggerFileInput}
          disabled={uploading || uploadedMedia.length >= maxFiles}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? (
            <>
              <Loader className="animate-spin" size={16} />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload size={16} />
              <span>
                {type === 'profile' ? 'Upload Profile Image' : 'Upload Images'}
              </span>
            </>
          )}
        </button>
        
        <span className="text-sm text-gray-500">
          {uploadedMedia.length}/{maxFiles} files
        </span>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={type !== 'profile'}
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Uploaded Media Preview */}
      {uploadedMedia.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Uploaded Media</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {uploadedMedia.map((media) => (
              <div key={media.id} className="relative group">
                <img
                  src={media.thumbnailUrl}
                  alt={media.originalName}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button" // ← Wichtig: Verhindert Form-Submit
                  onClick={() => handleRemoveMedia(media.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;