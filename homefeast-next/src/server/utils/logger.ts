type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const formatTimestamp = () => new Date().toISOString();

const log = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
  const entry = {
    timestamp: formatTimestamp(),
    level,
    message,
    ...meta,
  };
  const serialized = JSON.stringify(entry);
  if (level === 'error') console.error(serialized);
  else if (level === 'warn') console.warn(serialized);
  else console.log(serialized);
};

const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
};

export default logger;
