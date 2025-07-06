import BaseService from './baseService';

const API_URL = BaseService.getApiUrl();

class ShareService {
  // Post Share tracken
  static async sharePost(postId, shareType, metadata = {}) {
    try {
      // console.log('🔄 Sharing post:', { postId, shareType, metadata });

      const response = await fetch(`${API_URL}/api/posts/${postId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Optional auth header
          ...(localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        },
        body: JSON.stringify({ shareType, metadata })
      });

      const data = await response.json();
      // console.log('📥 Share response:', data);

      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Share post error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Social Media URLs generieren
  static generateShareUrl(platform, post, baseUrl = window.location.origin) {
    const postUrl = `${baseUrl}/post/${post.id}`;
    const title = post.title || 'Interessanter Post auf Loop-It';
    const description = post.content?.substring(0, 150) + (post.content?.length > 150 ? '...' : '');
    const hashtags = post.hashtags?.join(',') || '';

    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
      
      case 'twitter':
        const twitterText = `${title}\n\n${description}`;
        const twitterHashtags = hashtags ? `&hashtags=${encodeURIComponent(hashtags)}` : '';
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(postUrl)}${twitterHashtags}`;
      
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
      
      case 'whatsapp':
        const whatsappText = `${title}\n\n${description}\n\n${postUrl}`;
        return `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
      
      case 'telegram':
        const telegramText = `${title}\n\n${description}`;
        return `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(telegramText)}`;
      
      case 'email':
        const emailSubject = `Loop-It: ${title}`;
        const emailBody = `Ich dachte, das könnte dich interessieren:\n\n${title}\n\n${description}\n\n${postUrl}`;
        return `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      
      default:
        return postUrl;
    }
  }

  // Copy to Clipboard
  static async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      
      // Fallback für ältere Browser
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return { success: true };
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        return { success: false, error: 'Copy not supported' };
      }
    }
  }

  // Native Web Share API
  static async nativeShare(shareData) {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return { success: true, shared: true, shareType: 'native' };
      } catch (error) {
        if (error.name === 'AbortError') {
          return { success: true, shared: false }; // User cancelled
        }
        console.error('Native share failed:', error);
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: 'Native sharing not supported' };
  }

  // Share Statistics abrufen
  static async getShareStatistics(postId) {
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/share-statistics`);
      const data = await response.json();
      
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get share statistics error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Trending Shares abrufen
  static async getTrendingShares(timeframe = '24h', limit = 20) {
    try {
      const response = await fetch(`${API_URL}/api/posts/trending-shares?timeframe=${timeframe}&limit=${limit}`);
      const data = await response.json();
      
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get trending shares error:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

export default ShareService;