const { format, createLogger, transports } = require("winston");
const { timestamp, combine, errors, json, colorize } = format;

const logger = createLogger({
  format: combine(
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: "user-service" },
  transports: [
    new transports.Console(),
    new transports.File({ filename: "./logger/logs.json" }),
  ],
});

module.exports = logger;
