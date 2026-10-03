import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const SENSITIVE_KEYS = [
  "password",
  "token",
  "authorization",
  "cookie",
  "secret",
  "creditCard",
  "nin",
  "bvn",
  "accountNumber",
  "*.password",
  "*.token",
  "*.authorization",
  "*.creditCard",
  "headers.authorization",
  "headers.cookie",
];

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: SENSITIVE_KEYS,
    censor: "[REDACTED]",
  },
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

export function createRequestLogger(requestId: string, path?: string, method?: string) {
  return logger.child({
    requestId,
    ...(path && { path }),
    ...(method && { method }),
  });
}