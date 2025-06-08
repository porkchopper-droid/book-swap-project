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

      // Log details
      const offeredBookDoc = await Book.findById(offeredBook);
      const requestedBookDoc = await Book.findById(requestedBook);

      log(`📚 Restored offered book: "${offeredBookDoc?.title || "unknown"}"`);
      log(`📚 Restored requested book: "${requestedBookDoc?.title || "unknown"}"`);

      // Delete swap
      await SwapProposal.findByIdAndDelete(_id);

      log(`🗑️ Deleted reported swap ${_id}`);
    } else if (status === "cancelled") {
      log(`🗑️ Deleting cancelled swap ${_id} (older than 7 days)`);
      await SwapProposal.findByIdAndDelete(_id);
      log(`✅ Deleted cancelled swap ${_id}`);
    } else {
      log(`⌛ Expiring ${status} swap ${_id}`);

      // Set to expired
      swap.status = "expired";
      swap.expiredAt = new Date();
      await swap.save();

      // Revert book statuses
      await Book.findByIdAndUpdate(offeredBook, { status: "available" });
      await Book.findByIdAndUpdate(requestedBook, { status: "available" });

      // Log details
      const offeredBookDoc = await Book.findById(offeredBook);
      const requestedBookDoc = await Book.findById(requestedBook);

      log(`📚 Restored offered book: "${offeredBookDoc?.title || "unknown"}"`);
      log(`📚 Restored requested book: "${requestedBookDoc?.title || "unknown"}"`);

      log(`✅ Marked swap ${_id} as expired and reverted books`);
    }
  }
};
