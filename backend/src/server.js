import http from 'http';
import app from './app.js';
import { logger } from './utils/logger.js';
import { initSockets } from './sockets/index.js';
import { checkDbConnection } from './db/db.js';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

initSockets(server);

const startServer = async () => {
  try {
    await checkDbConnection();
    logger.info('Connected to PostgreSQL database');

    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
