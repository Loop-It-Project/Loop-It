import BaseService from './baseService';

const API_URL = BaseService.getApiUrl();

class AccountService extends BaseService {
  
  // Account deaktivieren
  static async deactivateAccount(reason) {
    try {
      const response = await BaseService.fetchWithAuth(`/account/deactivate`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });

      const result = await response.json();
      return response.ok ? { success: true, data: result } : { success: false, error: result.error };
    } catch (error) {
      console.error('Deactivate account error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Account reaktivieren
  static async reactivateAccount() {
    try {
      const response = await BaseService.fetchWithAuth(`/account/reactivate`, {
        method: 'POST'
      });

      const result = await response.json();
      return response.ok ? { success: true, data: result } : { success: false, error: result.error };
    } catch (error) {
      console.error('Reactivate account error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Account löschen
  static async deleteAccount(confirmPassword, reason) {
    try {
      const response = await BaseService.fetchWithAuth(`/account/delete`, {
        method: 'DELETE',
        body: JSON.stringify({ confirmPassword, reason })
      });

      const result = await response.json();
      return response.ok ? { success: true, data: result } : { success: false, error: result.error };
    } catch (error) {
      console.error('Delete account error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Account Status abrufen
  static async getAccountStatus() {
    try {
      const response = await BaseService.fetchWithAuth(`/account/status`);

      const result = await response.json();
      return response.ok ? { success: true, data: result.data } : { success: false, error: result.error };
    } catch (error) {
      console.error('Get account status error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Deletion Impact Report
  static async getDeletionImpactReport() {
    try {
      const response = await BaseService.fetchWithAuth(`/account/deletion-impact`);

      const result = await response.json();
      return response.ok ? { success: true, data: result.data } : { success: false, error: result.error };
    } catch (error) {
      console.error('Get deletion impact report error:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

export default AccountService;