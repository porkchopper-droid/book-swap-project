import cron from "node-cron";
import dotenv from "dotenv";
import mongoose from "mongoose";
import SwapProposal from "./models/SwapProposal.js";
import { revertBooksToAvailable } from "./utils/revertBookstoAvailable.js";
import { checkAndExpireSwap } from "./utils/checkAndExpireSwap.js";

import { log } from "./utils/logger.js";

dotenv.config();

console.log("🚀 Cron script started");
log("🚀 Cron script started");

mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log("✅ Connected to MongoDB");
  log("✅ Connected to MongoDB");

  cron.schedule("0 0 * * *", async () => {
    console.log(
      `\n🔄 [${new Date().toISOString()}] Running swap expiry check...`
    );
    log(`\n🔄 [${new Date().toISOString()}] Running swap expiry check...`);

    const swaps = await SwapProposal.find({
      status: { $in: ["pending", "accepted"] },
    });

    console.log(`📦 Found ${swaps.length} swap(s) to check.`);
    log(`📦 Found ${swaps.length} swap(s) to check.`);

    for (const swap of swaps) {
      console.log(`➡️ Checking swap: ${swap._id} (status: ${swap.status})`);
      log(`➡️ Checking swap: ${swap._id} (status: ${swap.status})`);
      await checkAndExpireSwap(swap);
    }

    console.log("✅ Finished checking all swaps.");
    log("✅ Finished checking all swaps.");
  });

  // 🧹 Daily cleanup of reported swaps
  cron.schedule("* * * * *", async () => {
    console.log(
      `\n🧼 [${new Date().toISOString()}] Cleaning up reported swaps...`
    );
    log(`\n🧼 [${new Date().toISOString()}] Cleaning up reported swaps...`);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const expiredReports = await SwapProposal.find({
      status: "reported",
      reportedAt: { $lte: sevenDaysAgo },
    });

    for (const swap of expiredReports) {
      await revertBooksToAvailable(swap);
      await SwapProposal.findByIdAndDelete(swap._id);
    }

    console.log(`🗑️ Deleted ${expiredReports.length} reported swaps.`);
    log(`🗑️ Deleted ${expiredReports.length} reported swaps.`);
  });
});
