import cron from "node-cron";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { log } from "../utils/logger.js";
import { findStaleSwaps } from "../utils/findStaleSwaps.js";
import { handleStaleSwaps } from "../utils/handleStaleSwaps.js";
import { deleteOldExpiredSwaps } from "../utils/deleteOldExpiredSwaps.js";
import { autoUnflagUsers } from "../utils/autoUnflagUsers.js";
import { generateDailyMetrics } from "../utils/generateDailyMetrics.js";
import { sendCronEmail } from "../utils/sendCronEmail.js";

dotenv.config();

log("🚀 Cron job starting...");

mongoose.connect(process.env.MONGO_URL).then(() => {
  log("✅ Connected to MongoDB");

  cron.schedule("05 23 * * *", async () => {
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
      await handleStaleSwaps(staleSwaps);
      logWrap(`✅ Handled ${staleSwaps.length} stale swaps in ${Date.now() - startStaleSwaps}ms`);
    } else {
      logWrap(`👍 No stale swaps found (took ${Date.now() - startStaleSwaps}ms)`);
    }

    // STEP 3: Auto-unflag users who served their penalty 👮
    const startUnflag = Date.now();
    const unflaggedCount = await autoUnflagUsers();
    logWrap(`✅ Auto-unflagged ${unflaggedCount} users in ${Date.now() - startUnflag}ms`);

    // STEP 4: deleting expired swaps which are older than 30 days
    const startDelete = Date.now();
    const deletedCount = await deleteOldExpiredSwaps();
    logWrap(`✅ Deleted ${deletedCount} old expired swap(s) in ${Date.now() - startDelete}ms`);
    logWrap("🎉 Finished handling swap maintenance");

    // STEP 5: send email
    await sendCronEmail({
      subject: "📘 Bookbook Cron Log - " + new Date().toLocaleDateString(),
      text: logs.join("\n"),
    });
  });
});
