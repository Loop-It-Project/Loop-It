import BaseService from './baseService';

const API_URL = BaseService.getApiUrl();

class BugReportService extends BaseService {

  // Create Bug Report
  static async createBugReport(data) {
    try {
      // Automatically capture browser/system info
      const browserInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        screenResolution: `${screen.width}x${screen.height}`,
        windowSize: `${window.innerWidth}x${window.innerHeight}`,
        colorDepth: screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        url: window.location.href,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
      };

      const requestData = {
        ...data,
        browserInfo: JSON.stringify(browserInfo),
        screenResolution: browserInfo.screenResolution,
        currentUrl: browserInfo.url
      };

      const response = await BaseService.fetchWithAuth(`/bug-reports`, {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      return response.ok ? { success: true, data: result.data } : { success: false, error: result.error };
    } catch (error) {
      console.error('Create bug report error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Get User's Bug Reports
  static async getUserBugReports(page = 1, limit = 10) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await BaseService.fetchWithAuth(`/bug-reports/my-reports?${params}`);

      const result = await response.json();
      return response.ok ? { success: true, data: result.data } : { success: false, error: result.error };
    } catch (error) {
      console.error('Get user bug reports error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Get Bug Report by ID
  static async getBugReportById(id) {
    try {
      const response = await BaseService.fetchWithAuth(`/bug-reports/${id}`);

      const result = await response.json();
      return response.ok ? { success: true, data: result.data } : { success: false, error: result.error };
    } catch (error) {
      console.error('Get bug report error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Admin: Get All Bug Reports
  static async getAllBugReports(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await BaseService.fetchWithAuth(`/bug-reports?${params}`);

      const result = await response.json();
      return response.ok ? { success: true, data: result.data } : { success: false, error: result.error };
    } catch (error) {
      console.error('Get all bug reports error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Admin: Update Bug Report Status
  static async updateBugReportStatus(id, updates) {
    try {
      const response = await BaseService.fetchWithAuth(`/bug-reports/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      const result = await response.json();
      return response.ok ? { success: true, data: result.data } : { success: false, error: result.error };
    } catch (error) {
      console.error('Update bug report error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Admin: Delete Bug Report
  static async deleteBugReport(id) {
    try {
      const response = await BaseService.fetchWithAuth(`/bug-reports/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      return response.ok ? { success: true } : { success: false, error: result.error };
    } catch (error) {
      console.error('Delete bug report error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Admin: Get Bug Report Statistics
  static async getBugReportStats() {
    try {
      const response = await BaseService.fetchWithAuth(`/bug-reports/admin/stats`);

      const result = await response.json();
      return response.ok ? { success: true, data: result.data } : { success: false, error: result.error };
    } catch (error) {
      console.error('Get bug report stats error:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

export default BugReportService;