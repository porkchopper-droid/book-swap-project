import cron from "node-cron";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { log } from "../utils/logger.js";
import { handleStaleSwaps } from "../utils/handleStaleSwaps.js";
import { findStaleSwaps } from "../utils/findStaleSwaps.js";
import { findAndDeleteOldExpiredSwaps } from "../utils/findAndDeleteOldExpiredSwaps.js";
import { autoUnflagUsers } from "../utils/autoUnflagUsers.js";
import { generateDailyMetrics } from "../utils/generateDailyMetrics.js";
import { sendCronEmail } from "../utils/sendCronEmail.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

log("🚀 Cron job starting...");

mongoose.connect(process.env.MONGO_URL).then(() => {
  log("✅ Connected to MongoDB");

  cron.schedule("* * * * *", async () => {
    let totalRestoredBooks = 0;

    // every midnight
    const logs = [];
    const logWrap = (msg) => {
      log(msg); // yes, we are still writing logs
      logs.push(`[${new Date().toISOString()}] ${msg}`); // and we are pushing them into email 😎
    };

    logWrap("⏰ Midnight task started");

    // STEP 1: Metrics snapshot
    const startMetrics = Date.now();
    await generateDailyMetrics();
    logWrap(`✅ Generated daily metrics snapshot in ${Date.now() - startMetrics}ms`);

    // STEP 2: looking for swaps older than 7 days and handling them gracefully
    const startStaleSwaps = Date.now();
    const staleSwaps = await findStaleSwaps();
    if (staleSwaps.length > 0) {
      const restored = await handleStaleSwaps(staleSwaps);
      logWrap(
        `✅ Handled ${staleSwaps.length} stale swaps ` +
          `(${restored} book${restored !== 1 ? "s" : ""} restored) ` +
          `in ${Date.now() - startStaleSwaps}ms`
      );
      totalRestoredBooks += restored;
    } else {
      logWrap(`👍 No stale swaps found (took ${Date.now() - startStaleSwaps}ms)`);
    }

    // STEP 3: Auto-unflag users who served their penalty 👮
    const startUnflag = Date.now();
    const { users: unflaggedCount, books: restoredViaUnflag } = await autoUnflagUsers();
    logWrap(
      `✅ Auto-unflagged ${unflaggedCount} user${unflaggedCount !== 1 ? "s" : ""} ` +
        `(${restoredViaUnflag} book${restoredViaUnflag !== 1 ? "s" : ""} restored) ` +
        `in ${Date.now() - startUnflag}ms`
    );
    totalRestoredBooks += restoredViaUnflag;

    // STEP 4: deleting expired swaps which are older than 30 days
    const startDelete = Date.now();
    const deletedCount = await findAndDeleteOldExpiredSwaps();
    logWrap(`✅ Deleted ${deletedCount} old expired swap(s) in ${Date.now() - startDelete}ms`);
    logWrap(
      `🎉 Finished handling swap maintenance: ${totalRestoredBooks} book${
        totalRestoredBooks !== 1 ? "s" : ""
      } were restored`
    );

    // STEP 5: send email
    await sendCronEmail(
      `📘 Bookbook Cron Log - ${new Date().toLocaleDateString()}`,
      logs.join("\n")
    );
  });
});
