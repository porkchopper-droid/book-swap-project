import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { log } from "../utils/logger.js";

import { generateDailyMetrics } from "../utils/generateDailyMetrics.js";
import { findStaleSwaps } from "../utils/findStaleSwaps.js";
import { handleStaleSwaps } from "../utils/handleStaleSwaps.js";
import { autoUnflagUsers } from "../utils/autoUnflagUsers.js";
import { findAndDeleteOldExpiredSwaps } from "../utils/findAndDeleteOldExpiredSwaps.js";
import { sendCronEmail } from "../utils/sendCronEmail.js";

/* ---------- load .env ---------- */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

/* ---------- main wrapper ---------- */
(async () => {
  const logs = [];
  const logWrap = (msg) => {
    const localTime = new Date().toLocaleString("sv-SE", {
      timeZone: process.env.TZ || "Europe/Berlin",
      hour12: false,
    });
    log(msg); // write to rotating file
    logs.push(`[${localTime}] ${msg}`); // readable timestamp
  };

  try {
    logWrap("🚀 Cron container starting…");

    await mongoose.connect(process.env.MONGO_URL);
    logWrap("✅ Connected to MongoDB");

    /* STEP 1 – daily metrics snapshot */
    const t1 = Date.now();
    await generateDailyMetrics();
    logWrap(`📊 Metrics generated in ${Date.now() - t1} ms`);

    /* STEP 2 – handle stale swaps */
    const t2 = Date.now();
    const stale = await findStaleSwaps();
    let restored = 0;
    if (stale.length) {
      restored = await handleStaleSwaps(stale);
      logWrap(
        `🔧 Handled ${stale.length} stale swaps, ${restored} books restored (${Date.now() - t2} ms)`
      );
    } else {
      logWrap(`👍 No stale swaps (${Date.now() - t2} ms)`);
    }

    /* STEP 3 – auto-unflag users */
    const { users: unflagged, books: booksRestored } = await autoUnflagUsers();
    logWrap(`🕊️ Unflagged ${unflagged} users, ${booksRestored} books restored`);

    /* STEP 4 – delete very old expired swaps */
    const removed = await findAndDeleteOldExpiredSwaps();
    logWrap(`🗑️ Deleted ${removed} expired swaps (>30 d old)`);

    /* STEP 5 – e-mail summary */
    await sendCronEmail(
      `📘 Bookbook Cron Log - ${new Date().toISOString().slice(0, 10)}`,
      logs.join("\n")
    );

    logWrap("🎉 Cron job finished successfully");
  } catch (err) {
    log("❌ Cron job FAILED: " + err.stack);
    await sendCronEmail("🚨 Bookbook Cron FAILED", err.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(0); // <-- tell Render the job is done
  }
})();
