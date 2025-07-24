import { http, HttpResponse } from 'msw'

const API_BASE = 'http://localhost:3000/api'

export const handlers = [
  // Auth endpoints return data in expected format
  http.post(`${API_BASE}/auth/login`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: { id: '1', username: 'testuser', email: 'test@example.com' },
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token'
      }
    })
  }),

  http.post(`${API_BASE}/auth/register`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: { id: '1', username: 'testuser', email: 'test@example.com' },
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token'
      }
    })
  }),

  http.post(`${API_BASE}/auth/logout`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  }),

  http.post(`${API_BASE}/auth/refresh`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      }
    })
  }),

  http.get(`${API_BASE}/auth/me`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User'
      }
    })
  }),

  http.post(`${API_BASE}/auth/forgot-password`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Password reset email sent'
    })
  }),

  http.post(`${API_BASE}/auth/reset-password`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Password reset successfully'
    })
  }),

  // User endpoints
  http.get(`${API_BASE}/users/profile`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User'
      }
    })
  }),

  http.put(`${API_BASE}/users/profile`, () => {
    return HttpResponse.json({
      success: true,
      data: { message: 'Profile updated successfully' }
    })
  }),

  // PostService endpoints return data in expected format
  http.post(`${API_BASE}/posts`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '1',
        title: 'New Test Post',
        content: 'New test content',
        author: { username: 'testuser' },
        createdAt: new Date().toISOString()
      }
    })
  }),

  http.delete(`${API_BASE}/posts/:postId`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: { message: 'Post deleted successfully' }
    })
  }),

  http.post(`${API_BASE}/posts/:postId/like`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        isLiked: true,
        likeCount: 5
      }
    })
  }),

  http.get(`${API_BASE}/posts/:postId/like-status`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        isLiked: true,
        likeCount: 10
      }
    })
  }),

  http.post(`${API_BASE}/posts/:postId/share`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        shareId: 'share-123',
        shareCount: 3
      }
    })
  }),

  http.get(`${API_BASE}/posts/:postId/share-statistics`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        totalShares: 15,
        sharesByType: { link: 10, embed: 5 },
        recentShares: []
      }
    })
  }),

  http.get(`${API_BASE}/posts/trending-shares`, ({ request }) => {
    const url = new URL(request.url)
    const timeframe = url.searchParams.get('timeframe') || '24h'
    const limit = url.searchParams.get('limit') || '20'
    
    return HttpResponse.json({
      success: true,
      data: {
        posts: [
          { id: '1', title: 'Trending Post 1', shareCount: 50 },
          { id: '2', title: 'Trending Post 2', shareCount: 30 }
        ],
        timeframe,
        limit: parseInt(limit)
      }
    })
  }),

  // Add missing test endpoints
  http.get(`${API_BASE}/test/endpoint`, () => {
    return HttpResponse.json({
      success: true,
      data: { message: 'Test endpoint response' }
    })
  }),

  // Error responses for testing
  http.get(`${API_BASE}/test/error`, () => {
    return HttpResponse.json(
      { success: false, error: 'Test error message' },
      { status: 400 }
    )
  }),

  http.get(`${API_BASE}/test/network-error`, () => {
    return HttpResponse.error()
  })
]