const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.info;

function formatTimestamp() {
  return new Date().toISOString();
}

function formatMessage(level, message, data = null) {
  const timestamp = formatTimestamp();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  if (data) {
    return `${prefix} ${message} ${JSON.stringify(data)}`;
  }
  return `${prefix} ${message}`;
}

const logger = {
  error: (message, data) => {
    if (currentLevel >= LOG_LEVELS.error) {
      console.error(formatMessage('error', message, data));
    }
  },
  warn: (message, data) => {
    if (currentLevel >= LOG_LEVELS.warn) {
      console.warn(formatMessage('warn', message, data));
    }
  },
  info: (message, data) => {
    if (currentLevel >= LOG_LEVELS.info) {
      console.log(formatMessage('info', message, data));
    }
  },
  debug: (message, data) => {
    if (currentLevel >= LOG_LEVELS.debug) {
      console.log(formatMessage('debug', message, data));
    }
  },
};

module.exports = logger;