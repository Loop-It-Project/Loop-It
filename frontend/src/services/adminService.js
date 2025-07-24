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
      const response = await BaseService.fetchWithAuth(`/admin/dashboard/metrics`, {
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

      const response = await BaseService.fetchWithAuth(`/admin/users?${params}`, {
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

      const response = await BaseService.fetchWithAuth(`/admin/moderation/reports?${params}`, {
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
      const response = await BaseService.fetchWithAuth(`/admin/users/${targetUserId}/assign-moderator`, {
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
      const response = await BaseService.fetchWithAuth(`/admin/moderation/approvals`, {
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
      const response = await BaseService.fetchWithAuth(`/admin/dashboard/metrics`, {
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

  // UNIVERSE MANAGEMENT
  // Alle Universes für Admin abrufen
  static async getAllUniverses(page = 1, limit = 50, search = '', status = '') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        status
      });
    
      const token = localStorage.getItem('token');

      const response = await BaseService.fetchWithAuth(`/admin/universes?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 AdminService: API Response Status:', response.status);
      const result = await response.json();
      console.log('🔍 AdminService: API Response Data:', result);

      return result;
    } catch (error) {
      console.error('❌ Get all universes error:', error);
      return { success: false, error: 'Fehler beim Laden der Universes' };
    }
  }

  // Universe Status ändern (Schließen/Öffnen)
  static async toggleUniverseStatus(universeId, isClosed) {
    try {
      const response = await BaseService.fetchWithAuth(`/admin/universes/${universeId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isClosed }),
      });

      return await response.json();
    } catch (error) {
      console.error('Toggle universe status error:', error);
      return { success: false, error: 'Fehler beim Ändern des Universe-Status' };
    }
  }

  // Universe aktivieren/deaktivieren
  static async toggleUniverseActive(universeId, isActive) {
    try {
      const response = await BaseService.fetchWithAuth(`/admin/universes/${universeId}/active`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });

      return await response.json();
    } catch (error) {
      console.error('Toggle universe active error:', error);
      return { success: false, error: 'Fehler beim Ändern des Universe-Aktiv-Status' };
    }
  }

  // Universe Ownership übertragen
  static async transferUniverseOwnership(universeId, newCreatorId) {
    try {
      const response = await BaseService.fetchWithAuth(`/admin/universes/${universeId}/transfer`, {
        method: 'PATCH',
        body: JSON.stringify({ newCreatorId }),
      });

      return await response.json();
    } catch (error) {
      console.error('Transfer universe ownership error:', error);
      return { success: false, error: 'Fehler beim Übertragen der Eigentümerschaft' };
    }
  }

  // Universe löschen (Soft Delete)
  static async deleteUniverse(universeId) {
    try {
      const response = await BaseService.fetchWithAuth(`/admin/universes/${universeId}`, {
        method: 'DELETE',
      });

      return await response.json();
    } catch (error) {
      console.error('Delete universe error:', error);
      return { success: false, error: 'Fehler beim Löschen des Universe' };
    }
  }

  // Universe wiederherstellen (Soft Delete)
  static async restoreUniverse(universeId) {
    try {
      const response = await BaseService.fetchWithAuth(`/admin/universes/${universeId}/restore`, {
        method: 'PATCH',
      });

      return await response.json();
    } catch (error) {
      console.error('Restore universe error:', error);
      return { success: false, error: 'Fehler beim Wiederherstellen des Universe' };
    }
  }

  // REPORTS MANAGEMENT
  // Get Reports
  static async getReports(page = 1, limit = 20, status = 'pending') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status
      });

      const response = await BaseService.fetchWithAuth(`/reports?${params}`, {
        method: 'GET'
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get reports error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  static async processReport(reportId, actionData) {
    try {
      const response = await BaseService.fetchWithAuth(`/reports/${reportId}/process`, {
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

  // Get Moderation Reports (Alias für Backward Compatibility)
  static async getModerationReports(page = 1, limit = 20, status = 'pending') {
    // Alias für getReports - für Backward Compatibility
    return this.getReports(page, limit, status);
  }

  static async getPendingApprovals() {
    try {
      const response = await BaseService.fetchWithAuth(`/admin/approvals`, {
        method: 'GET'
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get pending approvals error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  static async assignUniverseModerator(universeId, userId) {
    try {
      const response = await BaseService.fetchWithAuth(`/admin/universes/${universeId}/moderators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Assign universe moderator error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  static async updateUserRole(userId, roleData) {
    try {
      const response = await BaseService.fetchWithAuth(`/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roleData)
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Update user role error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  static async suspendUser(userId, reason, duration) {
    try {
      const response = await BaseService.fetchWithAuth(`/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason, duration })
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Suspend user error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Bug Report Methods
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

  static async recalculateUniverseCounters() {
    try {
      const response = await BaseService.fetchWithAuth(`/admin/universes/recalculate-counters`, {
        method: 'POST'
      });
    
      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Counter-Neuberechnung fehlgeschlagen' };
      }
    
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error recalculating universe counters:', error);
      return { success: false, error: 'Netzwerkfehler bei der Counter-Neuberechnung' };
    }
  }
}

export default AdminService;