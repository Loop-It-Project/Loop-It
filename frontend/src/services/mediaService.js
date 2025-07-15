import BaseService from './baseService';

const API_URL = BaseService.getApiUrl();

class MediaService {
  
  // Upload profile image
  static async uploadProfileImage(file) {
    try {
      console.log('📤 MediaService: Uploading profile image...', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      const formData = new FormData();
      formData.append('profileImage', file); // ← Korrigiert: profileImage field name

      console.log('📋 MediaService: FormData contents:', {
        hasProfileImage: formData.has('profileImage'),
        fileInfo: file ? { name: file.name, type: file.type, size: file.size } : null
      });

      const response = await fetch(`${BaseService.getApiUrl()}/api/media/upload/profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BaseService.getToken()}`
          // ✅ WICHTIG: Kein Content-Type Header für FormData!
        },
        body: formData
      });

      console.log('📥 MediaService: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ MediaService: Upload failed:', errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ MediaService: Profile image uploaded successfully:', result);
      return result;

    } catch (error) {
      console.error('❌ MediaService: Profile image upload error:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  // Upload post images
  static async uploadPostImages(files) {
    try {
      console.log('📤 MediaService: Uploading post images...', {
        count: files.length,
        files: files.map(f => ({ name: f.name, type: f.type, size: f.size }))
      });

      const formData = new FormData();
      
      // ✅ WICHTIG: Dateien als Array anhängen mit korrektem field name
      files.forEach((file, index) => {
        formData.append('postImages', file); // ← Korrigiert: postImages field name
        console.log(`📎 Added file ${index + 1}:`, file.name);
      });

      console.log('📋 MediaService: FormData contents:', {
        hasPostImages: formData.has('postImages'),
        fileCount: files.length,
        formDataEntries: Array.from(formData.entries()).length
      });

      const response = await fetch(`${BaseService.getApiUrl()}/api/media/upload/post`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BaseService.getToken()}`
          // ✅ WICHTIG: Kein Content-Type Header für FormData!
        },
        body: formData
      });

      console.log('📥 MediaService: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ MediaService: Upload failed:', errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ MediaService: Post images uploaded successfully:', result);
      return result;

    } catch (error) {
      console.error('❌ MediaService: Post images upload error:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  // Delete media
  static async deleteMedia(mediaId) {
    try {
      console.log('🗑️ MediaService: Deleting media:', mediaId);

      const response = await fetch(`${BaseService.getApiUrl()}/api/media/${mediaId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BaseService.getToken()}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ MediaService: Delete failed:', errorText);
        throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ MediaService: Media deleted successfully');
      return result;

    } catch (error) {
      console.error('❌ MediaService: Delete media error:', error);
      return {
        success: false,
        error: error.message || 'Delete failed'
      };
    }
  }

  // Get user media
  static async getUserMedia(page = 1, limit = 20) {
    try {
      console.log('📋 MediaService: Getting user media...', { page, limit });

      const response = await fetch(`${BaseService.getApiUrl()}/api/media/my-media?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BaseService.getToken()}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ MediaService: Get user media failed:', errorText);
        throw new Error(`Get user media failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ MediaService: User media retrieved successfully');
      return result;

    } catch (error) {
      console.error('❌ MediaService: Get user media error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get media'
      };
    }
  }

  // Get media URL
  static getMediaUrl(filename) {
    return `${BaseService.getApiUrl()}/api/media/serve/${filename}`;
  }

  // Get thumbnail URL
  static getThumbnailUrl(filename) {
    return `${BaseService.getApiUrl()}/api/media/thumbnail/${filename}`;
  }
}

export default MediaService;