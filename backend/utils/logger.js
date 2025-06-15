import { createRequire } from "module";
const require = createRequire(import.meta.url);

import fs from "fs";
import path from "path";

const rfs = require("rotating-file-stream");

// Define the logs directory relative to this file (logger.js)
const logsDirectory = path.resolve("logs"); // This points to "backend/logs"

// Create it (with parents, just in case)
if (!fs.existsSync(logsDirectory)) {
  fs.mkdirSync(logsDirectory, { recursive: true }); 
}

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
