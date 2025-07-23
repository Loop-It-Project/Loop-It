# Loop-It GitHub Copilot Instructions

## Project Overview

Loop-It is a full-stack social media platform built with modern web technologies. It features real-time communication, community management (called "Universes"), content sharing, and comprehensive user management.

### Architecture
- **Frontend**: React with Vite, TailwindCSS, JavaScript
- **Backend**: Node.js with Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: Socket.io for WebSocket communication
- **Authentication**: JWT-based with refresh tokens

## Core Principles

### 1. **Modular Architecture**
- Database schemas are split into logical modules (users, posts, universes, chat, etc.)
- Services follow single responsibility principle
- Controllers handle HTTP requests and delegate to services
- Clear separation between authentication, authorization, and business logic

### 2. **Type Safety**
- Always use TypeScript interfaces and types
- Export both `$inferSelect` and `$inferInsert` types from database schemas
- Use `AuthRequest` interface for authenticated endpoints
- Maintain consistent type definitions across frontend and backend

### 3. **Error Handling**
- All async functions should have proper try-catch blocks
- Use consistent error response format: `{ success: boolean, error?: string, data?: any }`
- Log errors with context information
- Return appropriate HTTP status codes

## Database Patterns

### Schema Organization
```typescript
// Always organize schemas in modules under /db/Schemas/
// Export tables, types, and relationships
export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  email: varchar({ length: 255 }).notNull().unique(),
  // ... other fields
});

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
```

### Relationships
- Use explicit foreign key references with `.references()`
- Add indexes for frequently queried fields
- Use composite indexes for complex queries

### Migrations
- Use Drizzle migrations: `npm run db:generate` then `npm run db:push`
- Never edit migration files directly
- Test migrations thoroughly before deployment

## Authentication Patterns

### JWT Implementation
```typescript
// Use AuthRequest interface for authenticated endpoints
interface AuthRequest extends Request {
  user?: { id: string; email: string; username: string };
}

// Always check authentication in controllers
if (!req.user?.id) {
  res.status(401).json({ success: false, error: 'User not authenticated' });
  return;
}
```

### Token Management
- Access tokens: 24 hours expiration
- Refresh tokens: 7 days expiration, stored in database
- Always validate tokens using `TokenService.verifyAccessToken()`
- Implement token refresh mechanism

## Service Layer Patterns

### Structure
```typescript
export class UserService {
  // Static methods for stateless operations
  static async createUser(userData: NewUser): Promise<ServiceResult<User>> {
    try {
      // Business logic here
      return { success: true, data: user };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: 'Failed to create user' };
    }
  }
}
```

### Service Results
- Always return consistent result objects
- Use `ServiceResult<T>` pattern: `{ success: boolean, data?: T, error?: string }`
- Log errors with context
- Handle database constraints appropriately

## Controller Patterns

### Request Handling
```typescript
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Authentication check
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    // 2. Input validation
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: 'User ID required' });
      return;
    }

    // 3. Delegate to service
    const result = await UserService.getUserById(id);
    
    // 4. Handle response
    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
```

### Validation
- Use `express-validator` for input validation
- Apply validation middleware before controllers
- Return clear validation error messages

## Frontend Patterns

### Service Layer
```javascript
// Use BaseService for common functionality
class UserService {
  static async getUserProfile(userId) {
    try {
      const response = await BaseService.fetchWithAuth(`/api/users/${userId}`);
      return response.ok ? { success: true, data: await response.json() } : { success: false, error: 'Failed to fetch' };
    } catch (error) {
      console.error('API error:', error);
      return { success: false, error: 'Network error' };
    }
  }
}
```

### Authentication
- Use `AuthInterceptor` for token management
- Check token expiration before requests
- Handle authentication errors gracefully
- Store tokens in localStorage

### Component Structure
- Use functional components with hooks
- Implement loading states and error handling
- Use consistent naming conventions
- Separate concerns (UI, state, API calls)

## WebSocket Patterns

### Connection Management
```typescript
// Authentication required for WebSocket connections
socket.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const decoded = TokenService.verifyAccessToken(token);
  socket.data.userId = decoded.id;
  next();
});
```

### Event Handling
- Use descriptive event names
- Implement proper error handling
- Log connection/disconnection events
- Handle room management for conversations and universes

## Security Guidelines

### Authentication
- Always validate JWT tokens
- Use bcrypt for password hashing (saltRounds: 10)
- Implement refresh token rotation
- Check user permissions for protected resources

### Authorization
- Implement role-based access control
- Check universe membership for universe-specific actions
- Validate user ownership for user-specific resources
- Use admin middleware for administrative functions

### Input Validation
- Sanitize all user inputs
- Use parameterized queries (Drizzle ORM handles this)
- Validate file uploads
- Implement rate limiting for API endpoints

## Error Handling Guidelines

### Logging
```typescript
// Use descriptive error messages with context
console.error('❌ Failed to create user:', {
  email: userData.email,
  username: userData.username,
  error: error.message
});
```

### Response Format
```typescript
// Consistent error response format
{
  success: false,
  error: 'User-friendly error message',
  code?: 'ERROR_CODE', // Optional error code
  details?: 'Technical details' // Only in development
}
```

## Performance Guidelines

### Database Optimization
- Use indexes for frequently queried fields
- Implement pagination for large result sets
- Use `select()` to fetch only needed fields
- Avoid N+1 queries with proper joins

### Caching Strategy
- Cache frequently accessed data
- Implement Redis for session management
- Use browser caching for static assets
- Cache computed values in services

## Testing Guidelines

### Unit Tests
- Test service layer methods
- Mock database connections
- Test error scenarios
- Validate input/output types

### Integration Tests
- Test API endpoints
- Verify authentication flows
- Test database operations
- Validate WebSocket connections

## Development Workflow

### Git Conventions
- Use descriptive commit messages
- Follow conventional commits format
- Create feature branches for new features
- Implement proper PR reviews

### Code Quality
- Use ESLint and Prettier
- Follow TypeScript strict mode
- Implement proper error boundaries
- Document complex business logic

### Environment Management
- Use environment variables for configuration
- Implement different configs for dev/staging/prod
- Validate required environment variables on startup
- Use secure defaults

## Common Patterns

### Search Implementation
```typescript
// Search with history tracking
const searchResult = await SearchService.searchContent(query, {
  userId: req.user.id,
  entityTypes: ['posts', 'users', 'universes'],
  saveToHistory: true
});
```

### Friendship Management
```typescript
// Check friendship status before allowing actions
const friendshipStatus = await FriendshipService.getFriendshipStatus(userId, targetUserId);
if (friendshipStatus !== 'friends') {
  return { success: false, error: 'Users must be friends' };
}
```

### Universe Operations
```typescript
// Verify universe membership
const membership = await UniverseService.checkMembership(universeId, userId);
if (!membership.isMember) {
  return res.status(403).json({ success: false, error: 'Access denied' });
}
```

## Specific Feature Guidelines

### Chat System
- Use WebSocket for real-time messaging
- Implement typing indicators
- Store message history in database
- Handle offline users gracefully

### Content Management
- Implement content moderation
- Support media uploads
- Handle post reactions and comments
- Implement soft deletes

### User Management
- Support profile customization
- Implement privacy settings
- Handle account deactivation/deletion
- Manage user preferences

## Documentation Standards

### Code Comments
- Document complex business logic
- Explain non-obvious implementation decisions
- Use TypeScript JSDoc comments for public APIs
- Keep comments up-to-date with code changes

### API Documentation
- Document all endpoints with OpenAPI/Swagger
- Include request/response examples
- Document authentication requirements
- Provide error response examples

## Migration and Deployment

### Database Migrations
- Always backup before migrations
- Test migrations in staging
- Use transactions for complex migrations
- Document migration procedures

### Deployment
- Use environment-specific configurations
- Implement health checks
- Monitor application performance
- Set up proper logging and alerting

---

## Quick Reference

### Common Commands
```bash
# Database operations
npm run db:generate  # Generate migrations
npm run db:push      # Apply migrations
npm run db:studio    # Open Drizzle Studio

# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
```

### Environment Variables
```bash
# Required variables
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
DATABASE_URL=postgresql://user:password@localhost/dbname
FRONTEND_URL=http://localhost:5173

# Optional variables
NODE_ENV=development
PORT=3000
```

### Common Imports
```typescript
// Backend
import { db } from '../db/connection';
import { usersTable, postsTable } from '../db/Schemas';
import { eq, and, or, desc, asc } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';

// Frontend
import BaseService from '../services/baseService';
import AuthInterceptor from '../utils/authInterceptor';
```

This document should be updated as the codebase evolves. Always refer to the latest version for current best practices and patterns.
