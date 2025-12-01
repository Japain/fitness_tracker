import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { config } from './config/env';
import { prisma } from './lib/prisma';
import passport from './middleware/auth';
import { csrfCookieParser, setCsrfToken } from './middleware/csrf';
import authRoutes from './routes/auth';
import workoutRoutes from './routes/workouts';
import workoutExerciseRoutes from './routes/workoutExercises';
import workoutSetRoutes from './routes/workoutSets';
import { logError } from './utils/errorLogger';

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

// Cookie parser middleware - Required for CSRF protection
app.use(csrfCookieParser);

// Session middleware - PostgreSQL-backed sessions
const PgSession = connectPgSimple(session);

app.use(session({
  store: new PgSession({
    conString: config.database.url,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: config.session.secret || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: config.isProduction, // HTTPS only in production
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Mount authentication routes
app.use('/api/auth', authRoutes);

// Mount workout API routes
app.use('/api/workouts', workoutRoutes);
app.use('/api/workouts', workoutExerciseRoutes);
app.use('/api/workouts', workoutSetRoutes);

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
    // Use secure error logging (sanitized in production)
    logError('Health check failed - database connection error', error);

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
const server = app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
  console.log(`📊 Database: ${config.database.url.split('@')[1]?.split('/')[0] || 'configured'}`);
  console.log(`🌐 CORS enabled for: ${config.cors.origin}`);
  console.log(`🔒 Security headers enabled via Helmet`);
});

/**
 * Graceful shutdown handler
 * Handles SIGTERM and SIGINT signals to clean up resources before exiting
 */
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async (err) => {
    if (err) {
      logError('Error closing HTTP server', err);
    } else {
      console.log('HTTP server closed');
    }

    try {
      // Disconnect Prisma Client to close database connections
      await prisma.$disconnect();
      console.log('Database connections closed');

      // Exit successfully
      process.exit(0);
    } catch (error) {
      logError('Error during graceful shutdown', error);
      // Exit with error code
      process.exit(1);
    }
  });

  // Force shutdown after timeout (10 seconds)
  setTimeout(() => {
    logError('Graceful shutdown timeout exceeded. Forcing shutdown...');
    process.exit(1);
  }, 10000);
}

// Register signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
