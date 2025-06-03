import cron from "node-cron";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { log } from "./utils/logger.js";
import { findStaleSwaps } from "./utils/findStaleSwaps.js";
import { handleStaleSwaps } from "./utils/handleStaleSwaps.js";
import { deleteOldExpiredSwaps } from "./utils/deleteOldExpiredSwaps.js";
import { sendEmail } from "./utils/sendCronEmail.js";

dotenv.config();

log("🚀 Cron job starting...");

mongoose.connect(process.env.MONGO_URL).then(() => {
  log("✅ Connected to MongoDB");

  cron.schedule("0 0 * * *", async () => { // every midnight
    const logs = [];
    const logWrap = (msg) => {
      log(msg); // yes, we are still writing logs
      logs.push(`[${new Date().toISOString()}] ${msg}`); // and we are pushing them into email 😎
    };

    logWrap("⏰ Midnight task started");

    // looking for swaps older then 7 days
    const staleSwaps = await findStaleSwaps();
    if (staleSwaps.length > 0) {
      await handleStaleSwaps(staleSwaps); // setting them as expired + books become available
      logWrap(`✅ Handled ${staleSwaps.length} stale swaps`);
    } else {
      logWrap("👍 No stale swaps found");
    }

    // deleting expired swaps which are older than 30 days
    await deleteOldExpiredSwaps();

    const deletedCount = await deleteOldExpiredSwaps();
    logWrap(`✅ Deleted ${deletedCount} old expired swap(s)`);

    logWrap("🎉 Finished handling swap maintenance");

    await sendEmail({
      subject: "📘 Bookbook Cron Log – " + new Date().toLocaleDateString(),
      text: logs.join("\n"),
    });
  });
});
