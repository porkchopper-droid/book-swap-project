import fs from "fs";
import path from "path";

export const log = (message) => {
  const logPath = path.resolve("cron.log");
  const timestamp = new Date().toISOString();
  const fullMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logPath, fullMessage, "utf8");
};