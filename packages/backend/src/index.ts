import { createApp } from './app';
import { config } from './config/env';
import { prisma } from './lib/prisma';
import { logError } from './utils/errorLogger';

const app = createApp();

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
