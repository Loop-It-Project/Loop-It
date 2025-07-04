import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import feedRoutes from './routes/feedRoutes';
import universeRoutes from './routes/universeRoutes';
import hashtagRoutes from './routes/hashtagRoutes';
import searchRoutes from './routes/searchRoutes';
import postRoutes from './routes/postRoutes';


// Environment variables laden
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', searchRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/universes', universeRoutes);
app.use('/api/hashtags', hashtagRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/posts', postRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Zusätzlich für API-Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});