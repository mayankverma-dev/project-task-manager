import pino from 'pino';
import path from 'path';
import fs from 'fs';
import pretty from 'pino-pretty';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const streams = [
  { stream: fs.createWriteStream(path.join(logDir, 'app.log'), { flags: 'a' }) }
];

if (process.env.NODE_ENV !== 'production') {
  streams.push({
    stream: pretty({
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname,req,res,responseTime',
    })
  });
} else {
  streams.push({ stream: process.stdout });
}

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
    bindings: () => ({}),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
}, pino.multistream(streams));
