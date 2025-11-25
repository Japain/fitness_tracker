import express from 'express';
import cors from 'cors';
import { config } from './config/env';

const app = express();

// Use configuration from env.ts
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Fitness Tracker API is running',
    environment: config.nodeEnv,
  });
});

app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
  console.log(`📊 Database: ${config.database.url.split('@')[1]?.split('/')[0] || 'configured'}`);
});
