import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { prisma } from './lib/prisma';

const app = express();

// Security middleware - Helmet sets various HTTP headers for security
app.use(helmet());

// CORS middleware - Allow requests from frontend
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Body parser middleware - Parse JSON request bodies
app.use(express.json());

// Health check endpoint - Verifies server and database connectivity
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ok',
      message: 'Fitness Tracker API is running',
      environment: config.nodeEnv,
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      message: 'Service unavailable',
      environment: config.nodeEnv,
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
  console.log(`📊 Database: ${config.database.url.split('@')[1]?.split('/')[0] || 'configured'}`);
  console.log(`🌐 CORS enabled for: ${config.cors.origin}`);
  console.log(`🔒 Security headers enabled via Helmet`);
});
