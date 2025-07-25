import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import { server } from './mocks/server'

// ✅ CRITICAL FIX: Override import.meta.env BEFORE any imports that use it
const originalEnv = import.meta.env

// Mock import.meta.env for tests - this must happen first!
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_URL: 'http://localhost:3000',
    MODE: 'test',
    DEV: false,
    PROD: false,
    SSR: false,
    BASE_URL: '/'
  },
  writable: true,
  configurable: true
})

// Test environment setup
beforeAll(() => {
  // Start MSW server for API mocking
  server.listen({ 
    onUnhandledRequest: 'warn'
  })
  
  console.log('🧪 MSW Server started for tests')
  console.log('🔧 Test environment VITE_API_URL:', import.meta.env.VITE_API_URL)
})

afterEach(() => {
  // Clean up DOM after each test
  cleanup()
  // Reset MSW handlers
  server.resetHandlers()
  // Clear localStorage
  localStorage.clear()
})

afterAll(() => {
  // Stop MSW server
  server.close()
  console.log('🧪 MSW Server stopped')
  
  // Restore original environment
  Object.defineProperty(import.meta, 'env', {
    value: originalEnv,
    writable: true,
    configurable: true
  })
})

// Mock window.location for navigation tests
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    reload: vi.fn()
  },
  writable: true
})

beforeAll(() => {
  // Mock console methods globally to avoid noise
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

// Mock fetch if not available
global.fetch = global.fetch || vi.fn()