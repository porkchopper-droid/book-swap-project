import User from "../models/User.js";
import Book from "../models/Book.js";
import { log } from "./logger.js";

export const autoUnflagUsers = async () => {
  const now = new Date();

  const flaggedUsers = await User.find({
    isFlagged: true,
    flaggedUntil: { $lte: now },
  });

  let booksRestored = 0;

  if (flaggedUsers.length === 0) {
    log("👍 No users to unflag today.");
    return { users: 0, books: 0 };
  }

  for (const user of flaggedUsers) {
    user.isFlagged = false;
    user.reportedCount = 0;
    user.flaggedUntil = null;
    await user.save();

    // Restore their reported books
    const { modifiedCount } = await Book.updateMany(
      { user: user._id, status: "reported" },
      { status: "available", reportedAt: null }
    );

    booksRestored += modifiedCount;

    log(`✅ Auto-unflagged user: ${user.username}`);
  }
  log(`🎉 Finished unflagging ${flaggedUsers.length} user(s).`);

  return { users: flaggedUsers.length, books: booksRestored };
};
