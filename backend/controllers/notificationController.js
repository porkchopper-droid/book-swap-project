import User from "../models/User.js";

export const getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    const unreadCounts = user.unreadCounts || {};
    return res.json(unreadCounts);
  } catch (err) {
    console.error("Failed to get unread counts:", err);
    res.status(500).json({ message: "Failed to fetch unread counts" });
  }
};

export const clearUnreadCount = async (req, res) => {
  try {
    const { swapId } = req.params;
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, {
      $unset: { [`unreadCounts.${swapId}`]: "" },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to clear unread count:", err);
    res.status(500).json({ message: "Failed to clear unread count" });
  }
};
