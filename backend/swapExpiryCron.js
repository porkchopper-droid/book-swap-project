import cron from "node-cron";
import mongoose from "mongoose";
import SwapProposal from "./models/SwapProposal.js";
import { checkAndExpireSwap } from "./utils/checkAndExpireSwap.js";
import dotenv from "dotenv";
dotenv.config();

console.log("🚀 Cron script started");

mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log("✅ Connected to MongoDB");

  cron.schedule("0 0 * * *", async () => {
    console.log(`\n🔄 [${new Date().toISOString()}] Running swap expiry check...`);

    const swaps = await SwapProposal.find({
      status: { $in: ["pending", "accepted"] },
    });

    console.log(`📦 Found ${swaps.length} swap(s) to check.`);

    for (const swap of swaps) {
      console.log(`➡️ Checking swap: ${swap._id} (status: ${swap.status})`);
      await checkAndExpireSwap(swap);
    }

    console.log("✅ Finished checking all swaps.");
  });
});