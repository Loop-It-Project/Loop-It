import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import AuthService from '../services/authService'
import BaseService from '../services/baseService'

// Mock WebSocketService für Tests
vi.mock('../services/websocketService', () => ({
  default: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    requestNotificationPermission: vi.fn().mockResolvedValue(true)
  }
}))

describe('AuthService', () => {
  let mockWebSocketService

  beforeEach(async () => {
    // Import the mocked module
    const WebSocketService = (await import('../services/websocketService')).default
    mockWebSocketService = WebSocketService

    // Clear localStorage vor jedem Test
    localStorage.clear()
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Reset WebSocket mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('register', () => {
    const validRegisterData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    }

    it('should register user successfully', async () => {
      const result = await AuthService.register(validRegisterData)
      
      expect(result.success).toBe(true)
      expect(result.data.user.username).toBe('testuser')
      expect(result.data.user.email).toBe('test@example.com')
      expect(result.data.accessToken).toBe('test-access-token')
      expect(result.data.refreshToken).toBe('test-refresh-token')
    })

    it('should store tokens in localStorage on successful registration', async () => {
      await AuthService.register(validRegisterData)
      
      expect(localStorage.getItem('accessToken')).toBe('test-access-token')
      expect(localStorage.getItem('refreshToken')).toBe('test-refresh-token')
    })

    it('should connect to WebSocket on successful registration', async () => {
      await AuthService.register(validRegisterData)
      
      expect(mockWebSocketService.connect).toHaveBeenCalledWith(
        'test-access-token',
        expect.objectContaining({ username: 'testuser' })
      )
    })

    it('should request notification permission on registration', async () => {
      await AuthService.register(validRegisterData)
      
      expect(mockWebSocketService.requestNotificationPermission).toHaveBeenCalled()
    })

    it('should handle registration errors', async () => {
      // Mock failed registration
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Email already exists' })
      })

      const result = await AuthService.register(validRegisterData)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Email already exists')
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(mockWebSocketService.connect).not.toHaveBeenCalled()
    })

    it('should handle network errors during registration', async () => {
      // Mock network error
      vi.spyOn(BaseService, 'fetchWithAuth').mockRejectedValueOnce(new Error('Network error'))

      const result = await AuthService.register(validRegisterData)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123'
    }

    it('should login user successfully', async () => {
      const result = await AuthService.login(validLoginData)
      
      expect(result.success).toBe(true)
      expect(result.data.user.username).toBe('testuser')
      expect(result.data.accessToken).toBe('test-access-token')
      expect(result.data.refreshToken).toBe('test-refresh-token')
    })

    it('should store tokens in localStorage on successful login', async () => {
      await AuthService.login(validLoginData)
      
      expect(localStorage.getItem('accessToken')).toBe('test-access-token')
      expect(localStorage.getItem('refreshToken')).toBe('test-refresh-token')
    })

    it('should connect to WebSocket on successful login', async () => {
      await AuthService.login(validLoginData)
      
      expect(mockWebSocketService.connect).toHaveBeenCalledWith(
        'test-access-token',
        expect.objectContaining({ username: 'testuser' })
      )
    })

    it('should handle login errors', async () => {
      // Mock failed login
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Invalid credentials' })
      })

      const result = await AuthService.login(validLoginData)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(mockWebSocketService.connect).not.toHaveBeenCalled()
    })

    it('should handle network errors during login', async () => {
      // Mock network error
      vi.spyOn(BaseService, 'fetchWithAuth').mockRejectedValueOnce(new Error('Connection failed'))

      const result = await AuthService.login(validLoginData)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('logout', () => {
    beforeEach(() => {
      // Setup authenticated state
      localStorage.setItem('accessToken', 'test-access-token')
      localStorage.setItem('refreshToken', 'test-refresh-token')
    })

    it('should logout user successfully', async () => {
      const result = await AuthService.logout()
      
      expect(result.success).toBe(true)
    })

    it('should clear tokens from localStorage', async () => {
      await AuthService.logout()
      
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(localStorage.getItem('refreshToken')).toBeNull()
    })

    it('should disconnect WebSocket', async () => {
      await AuthService.logout()
      
      expect(mockWebSocketService.disconnect).toHaveBeenCalled()
    })

    it('should handle logout errors gracefully', async () => {
      // Mock logout error
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Logout failed' })
      })

      const result = await AuthService.logout()
      
      // Should still clear local state even if server logout fails
      expect(result.success).toBe(false)
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(mockWebSocketService.disconnect).toHaveBeenCalled()
    })

    it('should handle network errors during logout', async () => {
      // Mock network error
      vi.spyOn(BaseService, 'fetchWithAuth').mockRejectedValueOnce(new Error('Network error'))

      const result = await AuthService.logout()
      
      // Should still clear local state on network error
      expect(result.success).toBe(false)
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(mockWebSocketService.disconnect).toHaveBeenCalled()
    })
  })

  describe('refreshTokens', () => {
    beforeEach(() => {
      localStorage.setItem('refreshToken', 'test-refresh-token')
    })

    it('should refresh tokens successfully', async () => {
      // Mock successful refresh response
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token'
          }
        })
      })

      const result = await AuthService.refreshTokens()
      
      expect(result.success).toBe(true)
      expect(result.accessToken).toBe('new-access-token')
      expect(localStorage.getItem('accessToken')).toBe('new-access-token')
      expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token')
    })

    it('should handle missing refresh token', async () => {
      localStorage.removeItem('refreshToken')

      const result = await AuthService.refreshTokens()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('No refresh token available')
    })

    it('should handle refresh token errors', async () => {
      // Mock failed refresh
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Invalid refresh token' })
      })

      const result = await AuthService.refreshTokens()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid refresh token')
      // Should clear tokens on refresh failure
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(localStorage.getItem('refreshToken')).toBeNull()
    })

    it('should handle network errors during token refresh', async () => {
      // Mock network error
      vi.spyOn(BaseService, 'fetchWithAuth').mockRejectedValueOnce(new Error('Network error'))

      const result = await AuthService.refreshTokens()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      localStorage.setItem('accessToken', 'test-access-token')

      const result = await AuthService.getCurrentUser()
      
      expect(result.success).toBe(true)
      expect(result.data.username).toBe('testuser')
      expect(result.data.email).toBe('test@example.com')
    })

    it('should handle unauthorized request', async () => {
      // Mock 401 response
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ success: false, error: 'Unauthorized' })
      })

      const result = await AuthService.getCurrentUser()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })

    it('should handle network errors', async () => {
      // Mock network error
      vi.spyOn(BaseService, 'fetchWithAuth').mockRejectedValueOnce(new Error('Network error'))

      const result = await AuthService.getCurrentUser()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('forgotPassword', () => {
    it('should send forgot password request successfully', async () => {
      const result = await AuthService.forgotPassword('test@example.com')
      
      expect(result.success).toBe(true)
    })

    it('should handle forgot password errors', async () => {
      // Mock error response
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Email not found' })
      })

      const result = await AuthService.forgotPassword('notfound@example.com')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Email not found')
    })

    it('should handle network errors', async () => {
      // Mock network error
      vi.spyOn(BaseService, 'fetchWithAuth').mockRejectedValueOnce(new Error('Network error'))

      const result = await AuthService.forgotPassword('test@example.com')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('resetPassword', () => {
    const resetData = {
      token: 'reset-token',
      password: 'newpassword123'
    }

    it('should reset password successfully', async () => {
      const result = await AuthService.resetPassword(resetData)
      
      expect(result.success).toBe(true)
    })

    it('should handle reset password errors', async () => {
      // Mock error response
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Invalid or expired token' })
      })

      const result = await AuthService.resetPassword(resetData)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid or expired token')
    })

    it('should handle network errors', async () => {
      // Mock network error
      vi.spyOn(BaseService, 'fetchWithAuth').mockRejectedValueOnce(new Error('Network error'))

      const result = await AuthService.resetPassword(resetData)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when access token exists', () => {
      localStorage.setItem('accessToken', 'test-token')
      
      const isAuth = AuthService.isAuthenticated()
      
      expect(isAuth).toBe(true)
    })

    it('should return false when no access token', () => {
      const isAuth = AuthService.isAuthenticated()
      
      expect(isAuth).toBe(false)
    })
  })

  describe('getToken', () => {
    it('should return access token when available', () => {
      localStorage.setItem('accessToken', 'test-token')
      
      const token = AuthService.getToken()
      
      expect(token).toBe('test-token')
    })

    it('should return null when no token available', () => {
      const token = AuthService.getToken()
      
      expect(token).toBeNull()
    })
  })
})