import SwapProposal from "../models/SwapProposal.js";
import Book from "../models/Book.js";
import { log } from "./logger.js";

export const handleStaleSwaps = async (staleSwaps) => {
  for (const swap of staleSwaps) {
    const { _id, offeredBook, requestedBook, status } = swap;

    if (status === "reported") {
      log(`⛏️ Reverting books for reported swap ${_id}`);

      // Mark books as available
      await Book.findByIdAndUpdate(offeredBook, { status: "available" });
      await Book.findByIdAndUpdate(requestedBook, { status: "available" });

      // Delete swap
      await SwapProposal.findByIdAndDelete(_id);

      log(`🗑️ Deleted reported swap ${_id}`);
    } else {
      log(`⌛ Expiring ${status} swap ${_id}`);

      // Set to expired if older than 7 days and not completed
      swap.status = "expired";
      swap.expiredAt = new Date();
      await swap.save();

      // Revert book statuses
      await Book.findByIdAndUpdate(offeredBook, { status: "available" });
      await Book.findByIdAndUpdate(requestedBook, { status: "available" });

      log(`✅ Marked swap ${_id} as expired and reverted books`);
    }
  }
};
