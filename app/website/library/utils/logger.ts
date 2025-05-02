import { createLogger, format, transports } from "winston";

// Define log level based on environment
const level = process.env.NODE_ENV === "production" ? "info" : "debug";

// Create the logger instance
export const logger = createLogger({
  level,
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: "poll-backend" },
  transports: [
    // Write to console
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp, ...metadata }) => {
          // Extract useful info for cleaner logs
          const { error, stack, ...rest } = metadata;
          const metaString = Object.keys(rest).length
            ? JSON.stringify(rest, null, 2)
            : "";

          // Format the log message
          return `${timestamp} ${level}: ${message}${
            metaString ? `\n${metaString}` : ""
          }${stack ? `\n${stack}` : ""}`;
        })
      ),
    }),
  ],
});

// If in production, add file logging
if (process.env.NODE_ENV === "production") {
  logger.add(
    new transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );

  logger.add(
    new transports.File({
      filename: "logs/combined.log",
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    })
  );
}

// Create specific loggers for different components
export const createComponentLogger = (component: string) => {
  return {
    info: (message: string, meta = {}) => {
      logger.info(message, { component, ...meta });
    },
    error: (message: string, meta = {}) => {
      logger.error(message, { component, ...meta });
    },
    warn: (message: string, meta = {}) => {
      logger.warn(message, { component, ...meta });
    },
    debug: (message: string, meta = {}) => {
      logger.debug(message, { component, ...meta });
    },
  };
};
