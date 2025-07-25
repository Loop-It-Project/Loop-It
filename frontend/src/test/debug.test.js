import { describe, it, expect } from 'vitest'
import BaseService from '../services/baseService'

describe('Environment Debug', () => {
  it('should use test environment variables', () => {
    console.log('🔍 Current import.meta.env:', import.meta.env)
    console.log('🔍 VITE_API_URL:', import.meta.env.VITE_API_URL)
    console.log('🔍 MODE:', import.meta.env.MODE)
    
    expect(import.meta.env.VITE_API_URL).toBe('http://localhost:3000')
    expect(import.meta.env.MODE).toBe('test')
  })

  it('should generate correct API URL', () => {
    const apiUrl = BaseService.getApiUrl()
    console.log('🔍 BaseService.getApiUrl():', apiUrl)
    
    expect(apiUrl).toBe('http://localhost:3000/api')
  })
})