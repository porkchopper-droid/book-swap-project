import Book from "../models/Book.js";

export const revertBooksToAvailable = async (proposal) => {
   console.log(`🔁 Attempting to revert books for swap ${proposal._id}`);
  console.log(`📖 offeredBook: ${proposal.offeredBook}`);
  console.log(`📖 requestedBook: ${proposal.requestedBook}`);

  const fromResult = await Book.findByIdAndUpdate(
    proposal.offeredBook,
    { status: "available" },
    { new: true } // return the updated doc
  );

  const toResult = await Book.findByIdAndUpdate(
    proposal.requestedBook,
    { status: "available" },
    { new: true }
  );

  console.log(`✅ offeredBook updated:`, fromResult?.status);
  console.log(`✅ requestedBook updated:`, toResult?.status);
};
