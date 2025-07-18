import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';

// Routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import feedRoutes from './routes/feedRoutes';
import universeRoutes from './routes/universeRoutes';
import hashtagRoutes from './routes/hashtagRoutes';
import searchRoutes from './routes/searchRoutes';
import postRoutes from './routes/postRoutes';
import adminRoutes from './routes/adminRoutes';
import reportRoutes from './routes/reportRoutes';
import friendshipRoutes from './routes/friendshipRoutes';
import chatRoutes from './routes/chatRoutes';
import universeChatRoutes from './routes/universeChatRoutes';
import bugReportRoutes from './routes/bugReportRoutes';
import accountRoutes from './routes/accountRoutes';
import mediaRoutes from './routes/mediaRoutes';
import swipeRoutes from './routes/swipeRoutes';

// Services
import { initializeWebSocketService } from './services/websocketService';
import { TokenService } from './services/tokenService';
import { metricsMiddleware, getMetrics } from './middleware/metrics';
import { seedAdminData } from './db/seeds/seedAdminData';

// Environment variables laden
dotenv.config();

// Helper functions für Type-safe Error Handling
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error occurred';
};

const getErrorStack = (error: unknown): string | undefined => {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
};

// Environment Validation
function validateEnvironment() {
  console.log('🔍 Checking environment variables...');
  console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 'NOT SET');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('PORT:', process.env.PORT || 'default');
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'default');

  const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    console.error('📁 Current working directory:', process.cwd());
    console.error('📄 Looking for .env file at:', `${process.cwd()}/.env`);
    process.exit(1);
  }

  // JWT_SECRET Länge prüfen
  if (process.env.JWT_SECRET!.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long');
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
}

// Validation vor Server-Start
validateEnvironment();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// WebSocket Service initialisieren
console.log('🔌 Initializing WebSocket service...');
const websocketService = initializeWebSocketService(httpServer);
console.log('✅ WebSocket service initialized');

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost',      // ← Für Frontend auf Port 80
    'http://localhost:3000'  // ← Für direkte Backend Calls
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Content-Length', 'Content-Disposition']
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Erlaubt Cross-Origin-Zugriff auf Media
  contentSecurityPolicy: {
    directives: {
      imgSrc: ["'self'", "data:", "http://localhost:*", "https://localhost:*"],
      mediaSrc: ["'self'", "http://localhost:*", "https://localhost:*"],
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws://localhost:*", "wss://localhost:*"]
    }
  }
}));

app.use(morgan('combined'));
// Media Routes VOR JSON-Parser registrieren
console.log('📝 Registering media routes BEFORE JSON parsing...');
console.log('  - Media routes at /api/media');
app.use('/api/media', mediaRoutes);
console.log('  ✅ Media routes loaded successfully');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(metricsMiddleware);

// Debug Middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`, {
    body: req.method === 'POST' ? Object.keys(req.body) : undefined,
    contentType: req.headers['content-type'],
    hasAuth: !!req.headers.authorization,
    isUpload: req.path.includes('/upload')
  });
  next();
});

// Routes mit Debug-Output registrieren
try {
  console.log('📝 Registering routes...');
  
  console.log('  - Auth routes at /api/auth');
  app.use('/api/auth', authRoutes);
  console.log('  ✅ Auth routes loaded successfully');
  
  console.log('  - User routes at /api/users');
  app.use('/api/users', userRoutes);
  console.log('  ✅ User routes loaded successfully');
  
  console.log('  - Search routes at /api/search');
  app.use('/api/search', searchRoutes);
  console.log('  ✅ Search routes loaded successfully');
  
  // Teste weitere Routes einzeln
  console.log('  - Feed routes at /api/feed');
  app.use('/api/feed', feedRoutes);
  console.log('  ✅ Feed routes loaded successfully');
  
  console.log('  - Post routes at /api/posts');
  app.use('/api/posts', postRoutes);
  console.log('  ✅ Post routes loaded successfully');

  console.log('  - Admin routes at /api/admin');
  app.use('/api/admin', adminRoutes);
  console.log('  ✅ Admin routes loaded successfully');

  console.log('  - Hashtag routes at /api/hashtags');
  app.use('/api/hashtags', hashtagRoutes);
  console.log('  ✅ Hashtag routes loaded successfully');
  
  console.log('  - Universe routes at /api/universes');
  app.use('/api/universes', universeRoutes);
  console.log('  ✅ Universe routes loaded successfully');

  console.log('  - Report routes at /api/reports');
  app.use('/api/reports', reportRoutes);
  console.log('  ✅ Report routes loaded successfully');

  console.log('  - Friendship routes at /api/friendships');
  app.use('/api/friendships', friendshipRoutes);
  console.log('  ✅ Friendship routes loaded successfully');

  console.log('  - Chat routes at /api/chats');
  app.use('/api/chats', chatRoutes);
  console.log('  ✅ Chat routes loaded successfully');

  console.log('  - Universe Chat routes at /api/universe-chat');
  app.use('/api/universe-chat', universeChatRoutes);
  console.log('  ✅ Universe Chat routes loaded successfully');

  console.log('  - Bug Report routes at /api/bug-reports');
  app.use('/api/bug-reports', bugReportRoutes);
  console.log('  ✅ Bug Report routes loaded successfully');

  console.log('  - Account routes at /api/account');
  app.use('/api/account', accountRoutes);
  console.log('  ✅ Account routes loaded successfully');

  console.log('  - Swipe routes at /api/swipe');
  app.use('/api/swipe', swipeRoutes);
  console.log('  ✅ Swipe routes loaded successfully');
  
  console.log('✅ All routes registered successfully');
} catch (error) {
  console.error('❌ Error registering routes:', getErrorMessage(error));
  const errorStack = getErrorStack(error);
  if (errorStack) {
    console.error('❌ Error stack:', errorStack);
  }
  process.exit(1);
}

// Cleanup Job für abgelaufene Refresh Tokens
const setupCleanupJob = () => {
  // Alle 24 Stunden ausführen
  setInterval(async () => {
    try {
      const deletedCount = await TokenService.cleanupExpiredTokens();
      console.log(`🧹 Cleanup: ${deletedCount} expired refresh tokens removed`);
    } catch (error) {
      console.error('Token cleanup error:', error);
    }
  }, 24 * 60 * 60 * 1000); // 24 Stunden

  // Initial cleanup beim Server-Start
  setTimeout(async () => {
    try {
      await TokenService.cleanupExpiredTokens();
      console.log('✅ Initial token cleanup completed');
    } catch (error) {
      console.error('Initial token cleanup error:', error);
    }
  }, 5000); // 5 Sekunden nach Start
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    env: {
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDbUrl: !!process.env.DATABASE_URL,
      port: process.env.PORT || 3000
    }
  });
});

// API Health check (für Nginx Proxy)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    env: {
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDbUrl: !!process.env.DATABASE_URL,
      port: process.env.PORT || 3000
    }
  });
});

app.get('/metrics', getMetrics);

console.log('✅ Health route registered');
console.log('✅ API Health route registered');

// 404 Handler
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({ error: 'Route not found' });
});

console.log('✅ 404 Handler registered');

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server Error:', getErrorMessage(err));
  const errorStack = getErrorStack(err);
  if (errorStack) {
    console.error('❌ Server Error Stack:', errorStack);
  }
  res.status(500).json({ error: 'Internal server error' });
});

console.log('✅ Error handler registered');

// Start server
httpServer.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 JWT_SECRET loaded: ${!!process.env.JWT_SECRET ? 'YES' : 'NO'}`);
  console.log('🔧 Server setup complete');

  // Admin-Daten seeden (mit Error-Handling)
  // try {
  //   await seedAdminData();
  //   console.log('✅ Admin data seeding completed');
  // } catch (error) {
  //   // ✅ Verwende die bereits definierten Helper-Funktionen
  //   console.error('⚠️ Admin data seeding failed (this is normal if tables don\'t exist yet):', getErrorMessage(error));
  //   const errorStack = getErrorStack(error);
  //   if (errorStack) {
  //     console.error('⚠️ Admin seeding error stack:', errorStack);
  //   }
  // }

  // ✅ Cleanup Job starten
  setupCleanupJob();
  console.log('🧹 Token cleanup job started');
  
  // Zeige finale Route-Struktur
  // console.log('📋 Available endpoints:');
  // console.log('  - POST /api/auth/login');
  // console.log('  - POST /api/auth/register');
  // console.log('  - GET  /api/search/');
  // console.log('  - GET  /api/search/trending');
  // console.log('  - GET  /api/hashtags/search');
  // console.log('  - GET  /api/hashtags/:hashtag/universe');
  // console.log('  - GET  /health');
});