import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import PostService from '../services/postService'
import BaseService from '../services/baseService'

describe('PostService', () => {
  beforeEach(() => {
    // Clear localStorage vor jedem Test
    localStorage.clear()
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Setup authenticated state für Tests
    localStorage.setItem('accessToken', 'test-access-token')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createPost', () => {
    const validPostData = {
      title: 'Test Post',
      content: 'This is a test post content',
      tags: ['test', 'post'],
      universeId: 'universe-123'
    }

    it('should create post successfully', async () => {
      const result = await PostService.createPost(validPostData)
      
      expect(result.success).toBe(true)
      expect(result.data.id).toBe('1')
      expect(result.data.title).toBe('New Test Post')
      expect(result.data.content).toBe('New test content')
    })

    it('should handle create post errors', async () => {
      // Mock failed creation
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Validation failed' })
      })

      const result = await PostService.createPost(validPostData)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation failed')
    })

    it('should handle network errors', async () => {
      // Mock network error
      vi.spyOn(BaseService, 'fetchWithAuth').mockRejectedValueOnce(new Error('Network error'))

      const result = await PostService.createPost(validPostData)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('should use correct endpoint and method', async () => {
      const fetchSpy = vi.spyOn(BaseService, 'fetchWithAuth')
      
      await PostService.createPost(validPostData)
      
      expect(fetchSpy).toHaveBeenCalledWith('/posts', {
        method: 'POST',
        body: JSON.stringify(validPostData)
      })
    })
  })

  describe('deletePost', () => {
    const postId = 'post-123'

    it('should delete post successfully', async () => {
      // Mock successful deletion
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: { message: 'Post deleted successfully' }
        })
      })

      const result = await PostService.deletePost(postId)
      
      expect(result.success).toBe(true)
      expect(result.data.message).toBe('Post deleted successfully')
    })

    it('should handle delete errors', async () => {
      // Mock failed deletion
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Post not found' })
      })

      const result = await PostService.deletePost(postId)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Post not found')
    })

    it('should handle network errors', async () => {
      // Mock network error
      vi.spyOn(BaseService, 'fetchWithAuth').mockRejectedValueOnce(new Error('Network error'))

      const result = await PostService.deletePost(postId)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('should use correct endpoint and method', async () => {
      const fetchSpy = vi.spyOn(BaseService, 'fetchWithAuth')
      
      await PostService.deletePost(postId)
      
      expect(fetchSpy).toHaveBeenCalledWith(`/posts/${postId}`, {
        method: 'DELETE'
      })
    })
  })

  describe('toggleLike', () => {
    const postId = 'post-123'

    it('should toggle like successfully', async () => {
      // Mock successful like toggle
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: { 
            isLiked: true, 
            likeCount: 5 
          }
        })
      })

      const result = await PostService.toggleLike(postId)
      
      expect(result.success).toBe(true)
      expect(result.data.isLiked).toBe(true)
      expect(result.data.likeCount).toBe(5)
    })

    it('should handle unlike scenario', async () => {
      // Mock successful unlike
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: { 
            isLiked: false, 
            likeCount: 4 
          }
        })
      })

      const result = await PostService.toggleLike(postId)
      
      expect(result.success).toBe(true)
      expect(result.data.isLiked).toBe(false)
      expect(result.data.likeCount).toBe(4)
    })

    it('should handle toggle like errors', async () => {
      // Mock failed like toggle
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Post not found' })
      })

      const result = await PostService.toggleLike(postId)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Post not found')
    })

    it('should handle network errors', async () => {
      // Mock network error
      vi.spyOn(BaseService, 'fetchWithAuth').mockRejectedValueOnce(new Error('Network error'))

      const result = await PostService.toggleLike(postId)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('should use correct endpoint and method', async () => {
      const fetchSpy = vi.spyOn(BaseService, 'fetchWithAuth')
      
      await PostService.toggleLike(postId)
      
      expect(fetchSpy).toHaveBeenCalledWith(`/posts/${postId}/like`, {
        method: 'POST'
      })
    })

    it('should log debug information', async () => {
      const consoleSpy = vi.spyOn(console, 'log')
      
      await PostService.toggleLike(postId)
      
      expect(consoleSpy).toHaveBeenCalledWith('🔍 Frontend toggleLike called for postId:', postId)
    })
  })

  describe('getLikeStatus', () => {
    const postId = 'post-123'

    it('should get like status successfully', async () => {
      // Mock successful like status retrieval
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: { 
            isLiked: true, 
            likeCount: 10 
          }
        })
      })

      const result = await PostService.getLikeStatus(postId)
      
      expect(result.success).toBe(true)
      expect(result.data.isLiked).toBe(true)
      expect(result.data.likeCount).toBe(10)
    })

    it('should handle get like status errors', async () => {
      // Mock failed like status retrieval
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Post not found' })
      })

      const result = await PostService.getLikeStatus(postId)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Post not found')
    })

    it('should use correct endpoint', async () => {
      const fetchSpy = vi.spyOn(BaseService, 'fetchWithAuth')
      
      await PostService.getLikeStatus(postId)
      
      expect(fetchSpy).toHaveBeenCalledWith(`/posts/${postId}/like-status`)
    })
  })

  describe('sharePost', () => {
    const postId = 'post-123'
    const shareType = 'link'
    const metadata = { platform: 'twitter' }

    it('should share post successfully', async () => {
      // Mock successful share
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: { 
            shareId: 'share-456',
            shareCount: 3 
          }
        })
      })

      const result = await PostService.sharePost(postId, shareType, metadata)
      
      expect(result.success).toBe(true)
      expect(result.data.shareId).toBe('share-456')
      expect(result.data.shareCount).toBe(3)
    })

    it('should handle share errors', async () => {
      // Mock failed share
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Sharing not allowed' })
      })

      const result = await PostService.sharePost(postId, shareType, metadata)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Sharing not allowed')
    })

    it('should use correct endpoint and payload', async () => {
      const fetchSpy = vi.spyOn(BaseService, 'fetchWithAuth')
      
      await PostService.sharePost(postId, shareType, metadata)
      
      expect(fetchSpy).toHaveBeenCalledWith(`/posts/${postId}/share`, {
        method: 'POST',
        body: JSON.stringify({ shareType, metadata })
      })
    })

    it('should handle empty metadata', async () => {
      const fetchSpy = vi.spyOn(BaseService, 'fetchWithAuth')
      
      await PostService.sharePost(postId, shareType)
      
      expect(fetchSpy).toHaveBeenCalledWith(`/posts/${postId}/share`, {
        method: 'POST',
        body: JSON.stringify({ shareType, metadata: {} })
      })
    })
  })

  describe('getShareStatistics', () => {
    const postId = 'post-123'

    it('should get share statistics successfully', async () => {
      // Mock successful statistics retrieval
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: { 
            totalShares: 15,
            sharesByType: { link: 10, embed: 5 },
            recentShares: []
          }
        })
      })

      const result = await PostService.getShareStatistics(postId)
      
      expect(result.success).toBe(true)
      expect(result.data.totalShares).toBe(15)
      expect(result.data.sharesByType).toEqual({ link: 10, embed: 5 })
    })

    it('should handle statistics errors', async () => {
      // Mock failed statistics retrieval
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Statistics not available' })
      })

      const result = await PostService.getShareStatistics(postId)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Statistics not available')
    })

    it('should use correct endpoint', async () => {
      const fetchSpy = vi.spyOn(BaseService, 'fetchWithAuth')
      
      await PostService.getShareStatistics(postId)
      
      expect(fetchSpy).toHaveBeenCalledWith(`/posts/${postId}/share-statistics`)
    })
  })

  describe('getTrendingShares', () => {
    it('should get trending shares with default parameters', async () => {
      // Mock successful trending shares retrieval
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          data: { 
            posts: [
              { id: '1', title: 'Trending Post 1', shareCount: 50 },
              { id: '2', title: 'Trending Post 2', shareCount: 30 }
            ]
          }
        })
      })

      const result = await PostService.getTrendingShares()
      
      expect(result.success).toBe(true)
      expect(result.data.posts).toHaveLength(2)
      expect(result.data.posts[0].shareCount).toBe(50)
    })

    it('should use custom timeframe and limit', async () => {
      const fetchSpy = vi.spyOn(BaseService, 'fetchWithAuth')
      const timeframe = '7d'
      const limit = 10
      
      await PostService.getTrendingShares(timeframe, limit)
      
      expect(fetchSpy).toHaveBeenCalledWith(
        `/posts/trending-shares?timeframe=${timeframe}&limit=${limit}`
      )
    })

    it('should use default parameters when none provided', async () => {
      const fetchSpy = vi.spyOn(BaseService, 'fetchWithAuth')
      
      await PostService.getTrendingShares()
      
      expect(fetchSpy).toHaveBeenCalledWith(
        '/posts/trending-shares?timeframe=24h&limit=20'
      )
    })

    it('should handle trending shares errors', async () => {
      // Mock failed trending shares retrieval
      vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'No trending data available' })
      })

      const result = await PostService.getTrendingShares()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('No trending data available')
    })

    it('should handle network errors', async () => {
      // Mock network error
      vi.spyOn(BaseService, 'fetchWithAuth').mockRejectedValueOnce(new Error('Network error'))

      const result = await PostService.getTrendingShares()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('API endpoint consistency', () => {
    it('should use consistent endpoint patterns', async () => {
      const fetchSpy = vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} })
      })

      const postId = 'test-post'

      // Test alle Endpoints
      await PostService.toggleLike(postId)
      await PostService.getLikeStatus(postId)
      await PostService.sharePost(postId, 'link')
      await PostService.getShareStatistics(postId)
      await PostService.deletePost(postId)

      // Verify endpoint patterns
      const calls = fetchSpy.mock.calls
      expect(calls[0][0]).toBe('/posts/test-post/like')
      expect(calls[1][0]).toBe('/posts/test-post/like-status')
      expect(calls[2][0]).toBe('/posts/test-post/share')
      expect(calls[3][0]).toBe('/posts/test-post/share-statistics')
      expect(calls[4][0]).toBe('/posts/test-post')
    })

    it('should not use /api prefix in any endpoint', async () => {
      const fetchSpy = vi.spyOn(BaseService, 'fetchWithAuth').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} })
      })

      await PostService.createPost({ title: 'test' })
      await PostService.getTrendingShares()

      const calls = fetchSpy.mock.calls
      calls.forEach(call => {
        expect(call[0]).not.toContain('/api')
        expect(call[0]).toMatch(/^\//) // Should start with /
      })
    })
  })

  describe('response data structure', () => {
    it('should handle nested data responses consistently', async () => {
      
      const result = await PostService.sharePost('post-123', 'link')
      
      expect(result.success).toBe(true)
      expect(result.data.shareId).toBe('share-123')
      expect(result.data.shareCount).toBe(3)
    })

    it('should return consistent error format', async () => {
      const services = [
        () => PostService.createPost({}),
        () => PostService.deletePost('123'),
        () => PostService.toggleLike('123'),
        () => PostService.sharePost('123', 'link'),
        () => PostService.getShareStatistics('123'),
        () => PostService.getTrendingShares()
      ]

      for (const serviceCall of services) {
        // Mock network error
        vi.spyOn(BaseService, 'fetchWithAuth').mockRejectedValueOnce(new Error('Test error'))

        const result = await serviceCall()
        
        expect(result).toEqual({
          success: false,
          error: 'Network error'
        })
      }
    })
  })
})