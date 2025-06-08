import { createRequire } from "module";
const require = createRequire(import.meta.url);
const rfs = require("rotating-file-stream");
import path from "path";

// Define the logs directory relative to this file (logger.js)
const logsDirectory = path.resolve("logs"); // This points to "backend/logs"

// Create a rotating stream
const stream = rfs.createStream("cron.log", {
  size: "100M", // Rotate at 100 MB
  interval: "1d", // (optional) rotate daily
  compress: "gzip", // Compress rotated files
  path: logsDirectory, // <<<< LOG FILES WILL BE IN /backend/logs
});

// Use it in logger:
export const log = (message) => {
  const timestamp = new Date().toISOString();
  const fullMessage = `[${timestamp}] ${message}\n`;
  stream.write(fullMessage);
};
