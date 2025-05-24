import SwapProposal from "../models/SwapProposal.js";
import { log } from "./logger.js";

export const deleteOldExpiredSwaps = async () => {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  const staleExpired = await SwapProposal.find({
    status: "expired",
    expiredAt: { $lte: cutoff },
  });

  for (const swap of staleExpired) {
    await SwapProposal.findByIdAndDelete(swap._id);
    log(`🗑️ Deleted expired swap ${swap._id} (older than 30 days)`);
  }

  log(`✅ Purged ${staleExpired.length} old expired swap(s)`);

  return staleExpired.length;
};
