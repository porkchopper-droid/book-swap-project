import SwapProposal from "../models/SwapProposal.js";
import { log } from "./logger.js";

export const findStaleSwaps = async () => {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  // Separate logic for reported swaps
  const reportedSwaps = await SwapProposal.find({
    status: "reported",
    // Look at reportedAt, not updatedAt
    reportedAt: { $lte: cutoff },
  });

  // Other stale swaps (excluding "reported")
  const otherStaleSwaps = await SwapProposal.find({
    status: { $in: ["pending", "accepted", "cancelled", "declined"] },
    updatedAt: { $lte: cutoff },
  });

  // Combine them
  const staleSwaps = [...reportedSwaps, ...otherStaleSwaps];

  log(`📦 Found ${staleSwaps.length} stale swap(s)`);
  return staleSwaps;
};
