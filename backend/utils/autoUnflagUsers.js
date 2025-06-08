import User from "../models/User.js";
import Book from "../models/Book.js";
import { log } from "./logger.js";

export const autoUnflagUsers = async () => {
  const now = new Date();

  const flaggedUsers = await User.find({
    isFlagged: true,
    flaggedUntil: { $lte: now },
  });

  if (flaggedUsers.length === 0) {
    log("👍 No users to unflag today.");
    return 0; // return 0 (as count)
  }

  for (const user of flaggedUsers) {
    user.isFlagged = false;
    user.reportedCount = 0;
    user.flaggedUntil = null;
    await user.save();

    // Restore their reported books
    await Book.updateMany(
      { user: user._id, status: "reported" },
      { status: "available", reportedAt: null }
    );

    log(`✅ Auto-unflagged user: ${user.username}`);
  }
  log(`🎉 Finished unflagging ${flaggedUsers.length} user(s).`);

  return flaggedUsers.length; // return count
};
