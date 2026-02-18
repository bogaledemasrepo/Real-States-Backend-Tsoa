import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // In development, use pino-pretty for readability
  // In production (Docker), use standard JSON for log aggregators
  transport: process.env.NODE_ENV !== 'production' 
    ? { target: 'pino-pretty', options: { colorize: true } } 
    : undefined,
});