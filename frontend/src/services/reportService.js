import BaseService from './baseService';

const API_URL = BaseService.getApiUrl();

class ReportService {
  
  // Post melden
  static async reportPost(postId, reason, description = '') {
    try {
      const response = await BaseService.fetchWithAuth(`${API_URL}/api/reports/posts/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason,
          description
        })
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Report post error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Reports abrufen (Admin)
  static async getReports(page = 1, limit = 20, status = 'pending') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status
      });

      const response = await BaseService.fetchWithAuth(`${API_URL}/api/reports?${params}`, {
        method: 'GET'
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get reports error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Report verarbeiten (Admin)
  static async processReport(reportId, actionData) {
    try {
      const response = await BaseService.fetchWithAuth(`${API_URL}/api/reports/${reportId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(actionData)
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Process report error:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

export default ReportService;