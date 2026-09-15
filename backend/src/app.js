import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.routes.js';
import workspacesRoutes from './modules/workspaces/workspaces.routes.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(pinoHttp({ logger }));

// API Routes will be mounted here
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspacesRoutes);

// Central error handler
app.use(errorHandler);

export default app;
