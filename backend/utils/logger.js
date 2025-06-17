import { createRequire } from "module";
const require = createRequire(import.meta.url);

import fs from "fs";
import path from "path";

const rfs = require("rotating-file-stream");

/* 1. Ensure ./logs exists */
const logsDir = path.resolve("logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

/* 2. Helper for YYYY-MM-DD */
const pad = (n) => (n < 10 ? "0" + n : n);

/* 3. Create rotating stream
      - First write of every process ➜ ./logs/cron.log   (live file)
      - As soon as the process exits, rfs closes/renames it to
        ./logs/cron-YYYY-MM-DD.log.gz
      - Next container run starts a brand-new cron.log    */
const stream = rfs.createStream(
  (time /* Date|null */, index) => {
    if (!time) return "cron.log"; // live
    const y = time.getFullYear();
    const m = pad(time.getMonth() + 1);
    const d = pad(time.getDate());
    return `cron-${y}-${m}-${d}${index ? "-" + index : ""}.log.gz`; // rotated
  },
  {
    interval: "1d", // <—— triggers rotation daily
    initialRotation: true, // <—— forces rotation at first run (avoids appending to stale file)
    compress: "gzip",
    path: logsDir,
  }
);

/* 4. Tiny helper */
export const log = (msg) => stream.write(`[${new Date().toISOString()}] ${msg}\n`);
