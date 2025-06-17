import User         from "../models/User.js";
import Message      from "../models/Message.js";
import SwapProposal from "../models/SwapProposal.js";
import DailyMetrics from "../models/DailyMetrics.js";
import { log }      from "./logger.js";

// Runs once per night – captures **yesterday** in pure UTC.
export const generateDailyMetrics = async () => {
  /* STEP 1: Anchor to today 00:00 UTC */
  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);          // e.g. 2025‑06‑17 00:00Z

  /* STEP 2: Start of yesterday 00:00 UTC */
  const startUTC = new Date(todayUTC);
  startUTC.setUTCDate(startUTC.getUTCDate() - 1);   // 2025‑06‑16 00:00Z

  /* STEP 3: End bound (exclusive) */
  const endUTC = todayUTC;                         // 2025‑06‑17 00:00Z

  const snapshotDate = startUTC.toISOString().slice(0, 10); // "2025‑06‑16"
  log(`📊 Generating daily metrics for ${snapshotDate}`);

  /* Counts */
  const [
    newUsers, messages, swapsInitiated,
    swapsAccepted, swapsCompleted,
    swapsReported, swapsCancelled, swapsExpired,
  ] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: startUTC, $lt: endUTC } }),
    Message.countDocuments({ createdAt: { $gte: startUTC, $lt: endUTC } }),
    SwapProposal.countDocuments({ createdAt: { $gte: startUTC, $lt: endUTC } }),
    SwapProposal.countDocuments({ status: "accepted",   updatedAt: { $gte: startUTC, $lt: endUTC } }),
    SwapProposal.countDocuments({ status: "completed",  updatedAt: { $gte: startUTC, $lt: endUTC } }),
    SwapProposal.countDocuments({ status: "reported",   updatedAt: { $gte: startUTC, $lt: endUTC } }),
    SwapProposal.countDocuments({ status: "cancelled",  updatedAt: { $gte: startUTC, $lt: endUTC } }),
    SwapProposal.countDocuments({ status: "expired",    updatedAt: { $gte: startUTC, $lt: endUTC } }),
  ]);

  /* Users by country */
  const usersByCountryAgg = await User.aggregate([
    { $match: { createdAt: { $gte: startUTC, $lt: endUTC } } },
    { $group: { _id: "$country", count: { $sum: 1 } } },
  ]);
  const usersByCountry = Object.fromEntries(
    usersByCountryAgg.map(({ _id, count }) => [ _id || "unknown", count ])
  );

  /* Upsert snapshot */
  await DailyMetrics.updateOne(
    { date: snapshotDate },
    {
      $set: {
        newUsers,
        messagesSent: messages,
        swapsInitiated,
        swapsAccepted,
        swapsCompleted,
        swapsReported,
        swapsCancelled,
        swapsExpired,
        usersByCountry,
      },
    },
    { upsert: true }
  );
  log(`✅ Daily metrics saved for ${snapshotDate}`);
};