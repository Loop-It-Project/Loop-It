import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock socket.io-client - alles inline ohne externe Variablen
vi.mock('socket.io-client', () => {
  // Inline Mock-Socket Definition
  const mockSocket = {
    connected: false,
    id: 'mock-socket-id',
    io: {
      uri: 'http://localhost:3000',
      engine: {
        transport: {
          name: 'websocket'
        }
      }
    },
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn()
  }
  
  return {
    io: vi.fn(() => mockSocket),
    __getMockSocket: () => mockSocket
  }
})

// Mock import.meta.env
vi.mock('import.meta', () => ({
  env: {
    VITE_API_URL: 'http://localhost:3000',
    MODE: 'test'
  }
}))

// Import services after mocks
import WebSocketService from '../services/websocketService'
import { io, __getMockSocket } from 'socket.io-client'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

// Mock Notification API
const mockNotification = vi.fn()
Object.defineProperty(window, 'Notification', {
  value: mockNotification,
  configurable: true
})

// Mock window functions
Object.defineProperty(window, 'showToast', {
  value: vi.fn(),
  writable: true
})

Object.defineProperty(window, 'dispatchEvent', {
  value: vi.fn(),
  writable: true
})

describe('WebSocketService', () => {
  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com'
  }
  
  const mockToken = 'mock-jwt-token'
  let mockSocket

  beforeEach(() => {
    // Get fresh mock socket
    mockSocket = __getMockSocket()
    
    // Reset all mocks
    vi.clearAllMocks()
    
    // Reset mock socket state
    mockSocket.connected = false
    Object.keys(mockSocket).forEach(key => {
      if (typeof mockSocket[key] === 'function') {
        mockSocket[key].mockClear?.()
      }
    })
    
    // Reset service state
    WebSocketService.socket = null
    WebSocketService.isConnected = false
    WebSocketService.currentUser = null
    WebSocketService.eventHandlers = new Map()
    WebSocketService.reconnectAttempts = 0
    WebSocketService.reconnectTimeout = null
    
    // Setup localStorage mock
    mockLocalStorage.getItem.mockReturnValue(mockToken)
    
    // Setup Notification mock
    mockNotification.permission = 'granted'
    
    // Setup window mocks
    window.showToast = vi.fn()
    window.dispatchEvent = vi.fn()
  })

  afterEach(() => {
    // Clean up
    if (WebSocketService.reconnectTimeout) {
      clearTimeout(WebSocketService.reconnectTimeout)
      WebSocketService.reconnectTimeout = null
    }
    
    WebSocketService.disconnect()
    vi.restoreAllMocks()
  })

  describe('Connection Management', () => {
    it('should connect to WebSocket with correct configuration', () => {
      WebSocketService.connect(mockToken, mockUser)

      expect(io).toHaveBeenCalledWith('http://localhost:3000', {
        auth: {
          token: mockToken
        },
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 10000,
        forceNew: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        extraHeaders: {
          'Origin': window.location.origin
        }
      })

      expect(WebSocketService.currentUser).toEqual(mockUser)
      expect(WebSocketService.socket).toBe(mockSocket)
    })

    it('should not connect if already connected', () => {
      mockSocket.connected = true
      WebSocketService.socket = mockSocket
      
      const consoleSpy = vi.spyOn(console, 'log')

      WebSocketService.connect(mockToken, mockUser)

      expect(consoleSpy).toHaveBeenCalledWith('🔌 WebSocket already connected')
      expect(io).not.toHaveBeenCalled()
    })

    it('should disconnect properly', () => {
      WebSocketService.socket = mockSocket
      WebSocketService.isConnected = true
      WebSocketService.currentUser = mockUser

      WebSocketService.disconnect()

      expect(mockSocket.disconnect).toHaveBeenCalled()
      expect(WebSocketService.socket).toBeNull()
      expect(WebSocketService.isConnected).toBe(false)
      expect(WebSocketService.currentUser).toEqual(mockUser)
      expect(WebSocketService.reconnectAttempts).toBe(0)
    })

    it('should calculate WebSocket URL correctly', () => {
      const url = WebSocketService.getWebSocketUrl()
      expect(url).toBe('http://localhost:3000')
    })
  })

  describe('Event Handling', () => {
    beforeEach(() => {
      WebSocketService.socket = mockSocket
    })

    it('should set up all required event handlers', () => {
      WebSocketService.setupEventHandlers()

      const expectedEvents = [
        'connect',
        'disconnect', 
        'connect_error',
        'match_notification',
        'message_received',
        'conversation_refresh',
        'new_conversation_created',
        'user_typing',
        'user_stopped_typing',
        'message_read_by',
        'conversation_joined',
        'conversation_left'
      ]

      expectedEvents.forEach(event => {
        expect(mockSocket.on).toHaveBeenCalledWith(event, expect.any(Function))
      })
    })

    it('should handle connect event correctly', () => {
      WebSocketService.setupEventHandlers()
      
      const connectCall = mockSocket.on.mock.calls.find(call => call[0] === 'connect')
      const connectHandler = connectCall[1]
      const mockHandler = vi.fn()
      
      WebSocketService.addEventListener('connected', mockHandler)
      connectHandler()

      expect(WebSocketService.isConnected).toBe(true)
      expect(WebSocketService.reconnectAttempts).toBe(0)
      expect(mockHandler).toHaveBeenCalled()
    })

    it('should handle disconnect event correctly', () => {
      WebSocketService.setupEventHandlers()
      
      const disconnectCall = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')
      const disconnectHandler = disconnectCall[1]
      const mockHandler = vi.fn()
      
      WebSocketService.addEventListener('disconnected', mockHandler)
      disconnectHandler('transport close')

      expect(WebSocketService.isConnected).toBe(false)
      expect(mockHandler).toHaveBeenCalledWith('transport close')
    })
  })

  describe('Conversation Management', () => {
    beforeEach(() => {
      WebSocketService.socket = mockSocket
      mockSocket.connected = true
    })

    it('should join conversations when connected', () => {
      const conversationIds = ['conv-1', 'conv-2', 'conv-3']

      WebSocketService.joinConversations(conversationIds)

      expect(mockSocket.emit).toHaveBeenCalledWith('join_conversations', conversationIds)
    })

    it('should join single conversation when connected', () => {
      const conversationId = 'conv-123'

      WebSocketService.joinConversation(conversationId)

      expect(mockSocket.emit).toHaveBeenCalledWith('join_conversation', conversationId)
    })

    it('should send messages when connected', () => {
      const conversationId = 'conv-123'
      const message = 'Hello, world!'

      WebSocketService.sendMessage(conversationId, message)

      expect(mockSocket.emit).toHaveBeenCalledWith('new_message', {
        conversationId,
        message
      })
    })

    it('should not join conversations when not connected', () => {
      mockSocket.connected = false
      const consoleSpy = vi.spyOn(console, 'log')

      WebSocketService.joinConversation('conv-123')

      expect(consoleSpy).toHaveBeenCalledWith('❌ Cannot join conversation: not connected')
      expect(mockSocket.emit).not.toHaveBeenCalled()
    })
  })

  describe('Typing Indicators', () => {
    beforeEach(() => {
      WebSocketService.socket = mockSocket
      mockSocket.connected = true
    })

    it('should start typing indicator', () => {
      const conversationId = 'conv-123'

      WebSocketService.startTyping(conversationId)

      expect(mockSocket.emit).toHaveBeenCalledWith('typing_start', conversationId)
    })

    it('should stop typing indicator', () => {
      const conversationId = 'conv-123'

      WebSocketService.stopTyping(conversationId)

      expect(mockSocket.emit).toHaveBeenCalledWith('typing_stop', conversationId)
    })

    it('should not send typing events when not connected', () => {
      mockSocket.connected = false

      WebSocketService.startTyping('conv-123')
      WebSocketService.stopTyping('conv-123')

      expect(mockSocket.emit).not.toHaveBeenCalled()
    })
  })

  describe('Universe Chat Management', () => {
    beforeEach(() => {
      WebSocketService.socket = mockSocket
      mockSocket.connected = true
    })

    it('should join universe chat', () => {
      const universeId = 'universe-123'

      WebSocketService.joinUniverseChat(universeId)

      expect(mockSocket.emit).toHaveBeenCalledWith('join_universe_chat', { universeId })
    })

    it('should leave universe chat', () => {
      const universeId = 'universe-123'

      WebSocketService.leaveUniverseChat(universeId)

      expect(mockSocket.emit).toHaveBeenCalledWith('leave_universe_chat', { universeId })
    })
  })

  describe('Reconnection Logic', () => {
    beforeEach(() => {
      WebSocketService.socket = mockSocket
      WebSocketService.currentUser = mockUser
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should handle reconnection attempts', () => {
      const connectSpy = vi.spyOn(WebSocketService, 'connect')
      
      WebSocketService.handleReconnect()
      expect(WebSocketService.reconnectAttempts).toBe(1)
      
      vi.advanceTimersByTime(2000)
      expect(connectSpy).toHaveBeenCalledWith(mockToken, mockUser)
    })

    it('should manually reconnect', () => {
      const disconnectSpy = vi.spyOn(WebSocketService, 'disconnect')
      const connectSpy = vi.spyOn(WebSocketService, 'connect')

      WebSocketService.reconnect()

      expect(disconnectSpy).toHaveBeenCalled()
      expect(connectSpy).toHaveBeenCalledWith(mockToken, mockUser)
    })

    it('should stop reconnecting after max attempts', () => {
      WebSocketService.reconnectAttempts = 5
      const emitSpy = vi.spyOn(WebSocketService, 'emitToHandlers')

      WebSocketService.handleReconnect()

      expect(emitSpy).toHaveBeenCalledWith('max_reconnect_attempts_reached')
    })
  })

  describe('Match Notifications', () => {
    const mockMatchData = {
      data: {
        otherUser: {
          id: 'user-456',
          username: 'otheruser',
          displayName: 'Other User'
        }
      }
    }

    it('should handle match notification', () => {
      WebSocketService.handleMatchNotification(mockMatchData)

      expect(mockNotification).toHaveBeenCalledWith('Neues Match! 🎉', {
        body: 'Du hast ein Match mit Other User!',
        icon: '/logo.png',
        tag: 'match-notification'
      })

      expect(window.showToast).toHaveBeenCalledWith({
        type: 'success',
        title: 'Neues Match! 🎉',
        message: 'Du hast ein Match mit Other User!',
        duration: 5000
      })

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'match_notification',
          detail: mockMatchData
        })
      )
    })

    it('should use username when displayName is not available', () => {
      const dataWithoutDisplayName = {
        data: {
          otherUser: {
            id: 'user-456',
            username: 'otheruser'
          }
        }
      }

      WebSocketService.handleMatchNotification(dataWithoutDisplayName)

      expect(mockNotification).toHaveBeenCalledWith('Neues Match! 🎉', {
        body: 'Du hast ein Match mit otheruser!',
        icon: '/logo.png',
        tag: 'match-notification'
      })
    })
  })

  describe('Static Methods', () => {
    it('should request notification permission successfully', async () => {
      Object.defineProperty(window, 'Notification', {
        value: {
          permission: 'default',
          requestPermission: vi.fn().mockResolvedValue('granted')
        },
        configurable: true
      })

      const result = await WebSocketService.constructor.requestNotificationPermission()
      expect(result).toBe(true)
      expect(window.Notification.requestPermission).toHaveBeenCalled()
    })

    it('should handle notification permission already granted', async () => {
      Object.defineProperty(window, 'Notification', {
        value: {
          permission: 'granted',
          requestPermission: vi.fn()
        },
        configurable: true
      })

      const result = await WebSocketService.constructor.requestNotificationPermission()
      expect(result).toBe(true)
      expect(window.Notification.requestPermission).not.toHaveBeenCalled()
    })
  })

  describe('Connection Status', () => {
    it('should return connection status correctly', () => {
      expect(WebSocketService.isWebSocketConnected()).toBe(false)

      WebSocketService.socket = mockSocket
      mockSocket.connected = true

      expect(WebSocketService.isWebSocketConnected()).toBe(true)
    })

    it('should provide connection info for debugging', () => {
      WebSocketService.socket = mockSocket
      WebSocketService.isConnected = true
      WebSocketService.currentUser = mockUser
      WebSocketService.reconnectAttempts = 2

      const info = WebSocketService.getConnectionInfo()

      expect(info).toEqual({
        isConnected: true,
        socketId: 'mock-socket-id',
        url: 'http://localhost:3000',
        transport: 'websocket',
        reconnectAttempts: 2,
        hasCurrentUser: true,
        hasToken: true
      })
    })
  })

  describe('Event Listener Management', () => {
    it('should add and remove event listeners', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      WebSocketService.addEventListener('test_event', handler1)
      WebSocketService.addEventListener('test_event', handler2)

      expect(WebSocketService.eventHandlers.get('test_event').size).toBe(2)

      WebSocketService.removeEventListener('test_event', handler1)

      expect(WebSocketService.eventHandlers.get('test_event').size).toBe(1)
      expect(WebSocketService.eventHandlers.get('test_event').has(handler2)).toBe(true)
    })

    it('should emit to handlers correctly', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const testData = { test: 'data' }

      WebSocketService.addEventListener('test_event', handler1)
      WebSocketService.addEventListener('test_event', handler2)

      WebSocketService.emitToHandlers('test_event', testData)

      expect(handler1).toHaveBeenCalledWith(testData)
      expect(handler2).toHaveBeenCalledWith(testData)
    })
  })
})