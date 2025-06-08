import User from "../models/User.js";
import Message from "../models/Message.js";
import SwapProposal from "../models/SwapProposal.js";
import DailyMetrics from "../models/DailyMetrics.js"; // new collection for daily snapshots
import { log } from "./logger.js";

export const generateDailyMetrics = async () => {
  // RIGHT NOW: June 9th 00:00

  // STEP 1: Create a Date object for RIGHT NOW
  const date = new Date(); // June 9th 00:00

  // STEP 2: Go back to start of previous day (June 8th 00:00)
  date.setDate(date.getDate() - 1); // June 8th 00:00
  date.setHours(0, 0, 0, 0); // Ensure it’s midnight exactly

  // STEP 3: Create "end of day" as tomorrow (June 9th 00:00)
  const tomorrow = new Date(date); // duplicate date
  tomorrow.setDate(date.getDate() + 1); // June 9th 00:00

  log(`📊 Generating daily metrics for ${date.toISOString().split("T")[0]}`);

  // Count new users (signed up today)
  const newUsersCount = await User.countDocuments({
    createdAt: { $gte: date, $lt: tomorrow },
  });

  // Count messages sent today
  const messagesSentCount = await Message.countDocuments({
    createdAt: { $gte: date, $lt: tomorrow },
  });

  // Count swaps by status
  const swapsInitiatedCount = await SwapProposal.countDocuments({
    createdAt: { $gte: date, $lt: tomorrow },
  });

  const swapsAcceptedCount = await SwapProposal.countDocuments({
    status: "accepted",
    updatedAt: { $gte: date, $lt: tomorrow },
  });

  const swapsCompletedCount = await SwapProposal.countDocuments({
    status: "completed",
    updatedAt: { $gte: date, $lt: tomorrow },
  });

  const swapsReportedCount = await SwapProposal.countDocuments({
    status: "reported",
    updatedAt: { $gte: date, $lt: tomorrow },
  });

  const swapsCancelledCount = await SwapProposal.countDocuments({
    status: "cancelled",
    updatedAt: { $gte: date, $lt: tomorrow },
  });

  const swapsExpiredCount = await SwapProposal.countDocuments({
    status: "expired",
    updatedAt: { $gte: date, $lt: tomorrow },
  });

  // Count new users by country
  const usersByCountryAgg = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: date, $lt: tomorrow },
      },
    },
    {
      $group: {
        _id: "$country",
        count: { $sum: 1 },
      },
    },
  ]);

  const usersByCountry = {};
  usersByCountryAgg.forEach((entry) => {
    usersByCountry[entry._id || "unknown"] = entry.count;
  });

  // Save snapshot to DB
  const snapshot = new DailyMetrics({
    date: date.toISOString().split("T")[0],
    newUsers: newUsersCount,
    messagesSent: messagesSentCount,
    swapsInitiated: swapsInitiatedCount,
    swapsAccepted: swapsAcceptedCount,
    swapsCompleted: swapsCompletedCount,
    swapsReported: swapsReportedCount,
    swapsCancelled: swapsCancelledCount,
    swapsExpired: swapsExpiredCount,
    usersByCountry,
  });

  const { _id, ...updatableFields } = snapshot.toObject(); // 🟢 remove _id
  await DailyMetrics.updateOne(
    { date: snapshot.date },
    { $set: updatableFields },
    { upsert: true }
  );
  log(`✅ Daily metrics saved for ${date.toISOString().split("T")[0]}`);
};
