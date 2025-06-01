import SwapProposal from "../models/SwapProposal.js";
import { log } from "./logger.js";

export const findStaleSwaps = async () => {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const staleSwaps = await SwapProposal.find({
    status: { $in: ["pending", "accepted", "reported", "cancelled"] },
    updatedAt: { $lte: cutoff },
  });

  log(`📦 Found ${staleSwaps.length} stale swap(s)`);
  return staleSwaps;
};
