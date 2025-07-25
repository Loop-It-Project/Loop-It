import BaseService from './baseService';

class MediaService {
  
  // Upload profile image
  static async uploadProfileImage(file) {
    try {
      // console.log('📤 MediaService: Uploading profile image...', {
      //   name: file.name,
      //   type: file.type,
      //   size: file.size
      // });

      const formData = new FormData();
      formData.append('profileImage', file); // ← Korrigiert: profileImage field name

      // console.log('📋 MediaService: FormData contents:', {
      //   hasProfileImage: formData.has('profileImage'),
      //   fileInfo: file ? { name: file.name, type: file.type, size: file.size } : null
      // });

      const response = await BaseService.fetchWithAuth(`/media/upload/profile`, {
        method: 'POST',
        body: formData
      });

      // console.log('📥 MediaService: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ MediaService: Upload failed:', errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      // console.log('✅ MediaService: Profile image uploaded successfully:', result);
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
      // console.log('📤 MediaService: Uploading post images...', {
      //   count: files.length,
      //   files: files.map(f => ({ 
      //     name: f.name, 
      //     type: f.type, 
      //     size: f.size,
      //     constructor: f.constructor.name
      //   }))
      // });

      // Validierung der Files
      if (!files || !Array.isArray(files) || files.length === 0) {
        throw new Error('No valid files provided');
      }

      const formData = new FormData();

      // Debug: FormData vor dem Hinzufügen der Dateien
      // console.log('📋 MediaService: Creating FormData...');
      
      // Dateien als Array anhängen mit korrektem field name
      files.forEach((file, index) => {
        // console.log(`📎 Adding file ${index + 1}:`, {
        //   name: file.name,
        //   type: file.type,
        //   size: file.size,
        //   lastModified: file.lastModified,
        //   isFile: file instanceof File,
        //   isBlob: file instanceof Blob
        // });

        formData.append('postImages', file, file.name);
      });

      // Debug: FormData nach dem Hinzufügen
      // console.log('📋 MediaService: FormData created:', {
      //   hasPostImages: formData.has('postImages'),
      //   entriesCount: Array.from(formData.entries()).length,
      //   entries: Array.from(formData.entries()).map(([key, value]) => ({
      //     key,
      //     valueType: value.constructor.name,
      //     fileName: value.name || 'no-name',
      //     fileSize: value.size || 'no-size'
      //   }))
      // });

      const response = await BaseService.fetchWithAuth(`/media/upload/post`, {
        method: 'POST',
        body: formData
      });

      // console.log('📥 MediaService: Response received:', {
      //   status: response.status,
      //   statusText: response.statusText,
      //   headers: Object.fromEntries(response.headers.entries())
      // });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ MediaService: Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      // console.log('✅ MediaService: Post images uploaded successfully:', result);
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
      // console.log('🗑️ MediaService: Deleting media:', mediaId);

      const response = await BaseService.fetchWithAuth(`/media/${mediaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ MediaService: Delete failed:', errorText);
        throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      // console.log('✅ MediaService: Media deleted successfully');
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
      // console.log('📋 MediaService: Getting user media...', { page, limit });

      const response = await BaseService.fetchWithAuth(`/media/my-media?page=${page}&limit=${limit}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ MediaService: Get user media failed:', errorText);
        throw new Error(`Get user media failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      // console.log('✅ MediaService: User media retrieved successfully');
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
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${baseUrl}/api/media/serve/${filename}`;
  }

  // Get thumbnail URL
  static getThumbnailUrl(filename) {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${baseUrl}/api/media/thumbnail/${filename}`;
  }
}

export default MediaService;