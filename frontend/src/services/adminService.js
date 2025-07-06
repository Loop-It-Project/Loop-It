import BaseService from './baseService';
import AuthInterceptor from '../utils/authInterceptor';

const API_URL = BaseService.getApiUrl();

class AdminService {
  
  // Auth Headers mit Token-Validation
  static getAuthHeaders() {
    const token = localStorage.getItem('token');
    
    if (AuthInterceptor.isTokenExpired(token)) {
      console.warn('🔒 Token ist abgelaufen - initiiere Logout');
      AuthInterceptor.handleLogout?.();
      throw new Error('Session abgelaufen');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Fetch mit Auth-Interceptor
  static async fetchWithAuth(url, options = {}) {
    try {
      let token = localStorage.getItem('token');
      
      if (AuthInterceptor.isTokenExpired(token)) {
        console.log('🔄 Token läuft bald ab - erneuere präventiv...');
        try {
          token = await AuthInterceptor.refreshTokens();
        } catch (refreshError) {
          console.error('Preventive token refresh failed:', refreshError);
        }
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.headers
        }
      });

      return await AuthInterceptor.handleResponse(response, { url, options });
    } catch (error) {
      console.error('AdminService request error:', error);
      throw error;
    }
  }

  // Dashboard Metriken abrufen
  static async getDashboardMetrics() {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/api/admin/dashboard/metrics`, {
        method: 'GET'
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get dashboard metrics error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Alle User abrufen
  static async getAllUsers(page = 1, limit = 50, search = '', role = '') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(role && { role })
      });

      const response = await this.fetchWithAuth(`${API_URL}/api/admin/users?${params}`, {
        method: 'GET'
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get all users error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Moderation Reports abrufen
  static async getModerationReports(page = 1, limit = 20, status = 'pending') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status
      });

      const response = await this.fetchWithAuth(`${API_URL}/api/admin/moderation/reports?${params}`, {
        method: 'GET'
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get moderation reports error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Universe Moderator zuweisen
  static async assignUniverseModerator(universeId, targetUserId) {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/api/admin/users/${targetUserId}/assign-moderator`, {
        method: 'POST',
        body: JSON.stringify({ universeId, targetUserId })
      });

      const data = await response.json();
      return response.ok ? { success: true, message: data.message } : { success: false, error: data.error };
    } catch (error) {
      console.error('Assign universe moderator error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Pending Approvals abrufen
  static async getPendingApprovals() {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/api/admin/moderation/approvals`, {
        method: 'GET'
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get pending approvals error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Check Admin Permissions
  static async checkAdminPermissions() {
    // console.log('🔍 AdminService: Checking admin permissions...');
    
    try {
      const response = await this.fetchWithAuth(`${API_URL}/api/admin/dashboard/metrics`, {
        method: 'GET'
      });

    //   console.log('📡 Admin check response status:', response.status);

      // Wenn der Request erfolgreich ist, hat der User Admin-Rechte
      if (response.ok) {
        // console.log('✅ Admin permissions granted by backend');
        return { success: true, isAdmin: true };
      } else if (response.status === 403) {
        console.log('❌ Admin access denied by backend');
        return { success: true, isAdmin: false };
      } else {
        console.log('⚠️ Unexpected response status:', response.status);
        return { success: false, error: 'Permission check failed' };
      }
    } catch (error) {
      console.error('❌ Admin permission check error:', error);
      
      // ERWEITERTE Development-Fallback Logic
      if (import.meta.env.DEV || window.location.hostname === 'localhost') {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        // console.log('🔧 Development Mode - Current user:', user);
        
        const devAdmins = ['admin', 'developer', 'testadmin', 'Zerrelius'];
        const devAdminEmails = ['admin@loop-it.com', 'developer@loop-it.com', 'test@admin.com', 'Zerrelius@gmail.com'];
        
        const isDevAdmin = devAdmins.includes(user.username) || devAdminEmails.includes(user.email);
        
        // console.log('🔧 Development Admin Check:', {
        //   username: user.username,
        //   email: user.email,
        //   isInAdminList: devAdmins.includes(user.username),
        //   isInEmailList: devAdminEmails.includes(user.email),
        //   isDevAdmin
        // });
        
        if (isDevAdmin) {
          console.log('🔧 Development: Granting admin access for testing');
          return { success: true, isAdmin: true };
        } else {
          console.log('🔧 Development: User is not in admin list');
        }
      }
      
      return { success: false, error: 'Network error' };
    }
  }
}

export default AdminService;