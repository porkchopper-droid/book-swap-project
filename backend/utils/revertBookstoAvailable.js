import Book from "../models/Book.js";
import { log } from "./logger.js";

export const revertBooksToAvailable = async (proposal) => {
  console.log(`🔁 Attempting to revert books for swap ${proposal._id}`);
  console.log(`📖 offeredBook: ${proposal.offeredBook}`);
  console.log(`📖 requestedBook: ${proposal.requestedBook}`);

  log(`🔁 Attempting to revert books for swap ${proposal._id}`);
  log(`📖 offeredBook: ${proposal.offeredBook}`);
  log(`📖 requestedBook: ${proposal.requestedBook}`);

  const fromResult = await Book.findByIdAndUpdate(
    proposal.offeredBook,
    { status: "available", reportedAt: null },
    { new: true } // return the updated doc
  );

  const toResult = await Book.findByIdAndUpdate(
    proposal.requestedBook,
    { status: "available", reportedAt: null },
    { new: true }
  );

  console.log(`✅ offeredBook updated: ${fromResult?.status}`);
  console.log(`✅ requestedBook updated: ${toResult?.status}`);

  log(`✅ offeredBook updated: ${fromResult?.status}`);
  log(`✅ requestedBook updated: ${toResult?.status}`);
};
