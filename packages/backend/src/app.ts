import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { config } from './config/env';
import passport from './middleware/auth';
import { csrfCookieParser } from './middleware/csrf';
import authRoutes from './routes/auth';
import exerciseRoutes from './routes/exercises';
import workoutRoutes from './routes/workouts';
import workoutExerciseRoutes from './routes/workoutExercises';
import workoutSetRoutes from './routes/workoutSets';
import { prisma } from './lib/prisma';
import { logError } from './utils/errorLogger';

export function createApp(): express.Application {
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

  // Build cookie configuration
  // In development: omit sameSite to allow cross-origin cookies (localhost:3000 <-> localhost:5173)
  // In production: use sameSite 'lax' for CSRF protection
  const cookieConfig: session.CookieOptions = {
    httpOnly: true,
    secure: config.isProduction, // HTTPS only in production
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  // Only set sameSite in production (development needs cross-origin cookies for OAuth flow)
  if (config.isProduction) {
    cookieConfig.sameSite = 'lax';
  }

  app.use(session({
    store: new PgSession({
      conString: config.database.url,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: config.session.secret || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: cookieConfig,
  }));

  // Initialize Passport and restore authentication state from session
  app.use(passport.initialize());
  app.use(passport.session());

  // Mount authentication routes
  app.use('/api/auth', authRoutes);

  // Mount exercise library routes
  app.use('/api/exercises', exerciseRoutes);

  // Mount workout API routes
  app.use('/api/workouts', workoutRoutes);
  app.use('/api/workouts', workoutExerciseRoutes);
  app.use('/api/workouts', workoutSetRoutes);

  // Health check endpoint - Verifies server and database connectivity
  app.get('/api/health', async (_req, res) => {
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

  return app;
}
