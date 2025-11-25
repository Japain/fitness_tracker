import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env file based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development';

// Load from project root (two levels up from this file)
const envPath = path.resolve(__dirname, '../../../..', envFile);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn(`Warning: Could not load ${envFile}. Using system environment variables.`);
}

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'PORT',
  'NODE_ENV',
];

// These are optional during initial development but required for production
const optionalInDev = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
  'SESSION_SECRET',
];

const missing = requiredEnvVars.filter(key => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

// Warn about missing optional vars in production
if (process.env.NODE_ENV === 'production') {
  const missingOptional = optionalInDev.filter(key => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missingOptional.join(', ')}`);
  }
}

// Export typed configuration
export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  database: {
    url: process.env.DATABASE_URL!,
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },

  session: {
    secret: process.env.SESSION_SECRET,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
} as const;
