import User from "../models/User.js";
import Book from "../models/Book.js";
import SwapProposal from "../models/SwapProposal.js";
import Message from "../models/Message.js";
import UserTombstone from "../models/UserTombstone.js";
import bcrypt from "bcrypt";
import cloudinary from "../config/cloudinary.js";
import { encryptMessage } from "../utils/crypto.js";

export const getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("username email country city location");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user info" });
  }
};

export const getFullProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Basic user info
    const user = await User.findById(userId).select("username email city country profilePicture");

    // Quick stats
    const booksCount = await Book.countDocuments({ user: userId });
    const totalSwaps = await SwapProposal.countDocuments({
      $or: [{ from: userId }, { to: userId }],
      status: "completed",
    });

    const lastSwap = await SwapProposal.findOne({
      $or: [{ from: userId }, { to: userId }],
      status: "completed",
    }).sort({ completedAt: -1 });

    const lastSwapDate = lastSwap?.completedAt || null;

    // const badges = [
    //   { name: "Bronze Medal 🥉", achieved: booksCount >= 1 },
    //   { name: "Silver Medal 🥈", achieved: booksCount >= 5 },
    //   { name: "Gold Medal 🥇", achieved: booksCount >= 10 },
    // ];

    // Fetch user's books (shortlist)
    const userBooks = await Book.find({ user: userId }).select("title author coverUrl");

    res.json({
      user,
      stats: {
        booksCount,
        totalSwaps,
        lastSwapDate,
        // badges,
      },
      userBooks,
    });
  } catch (err) {
    console.error("Failed to fetch profile:", err);
    res.status(500).json({ message: "Server error while fetching profile." });
  }
};

export const getDailyBooksStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // 🗓️ Get month/year from query params or use current month/year
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1; // 1-based

    // 🗓️ Build start and end of month
    const startOfMonth = new Date(year, month - 1, 1);
    const startOfNextMonth = new Date(year, month, 1);

    const dailyBooks = await Book.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          day: "$_id",
          count: 1,
          _id: 0,
        },
      },
      { $sort: { day: 1 } },
    ]);

    res.json({ month, year, dailyBooks });
  } catch (err) {
    console.error("Failed to fetch daily book stats:", err);
    res.status(500).json({ message: "Server error while fetching daily book stats." });
  }
};

export const getDailySwapsStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // 🗓️ Get month/year from query params or default to current month/year
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1; // 1-based

    // 🗓️ Build date range for that month
    const startOfMonth = new Date(year, month - 1, 1);
    const startOfNextMonth = new Date(year, month, 1);

    const dailySwaps = await SwapProposal.aggregate([
      {
        $match: {
          $or: [{ from: userId }, { to: userId }],
          status: "completed",
          completedAt: { $gte: startOfMonth, $lt: startOfNextMonth },
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: "$completedAt" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          day: "$_id",
          count: 1,
          _id: 0,
        },
      },
      { $sort: { day: 1 } },
    ]);

    res.json({ month, year, dailySwaps });
  } catch (err) {
    console.error("Failed to fetch daily swap stats:", err);
    res.status(500).json({ message: "Server error while fetching daily swap stats." });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      "username email country city location"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user info" });
  }
};

export const updateUserLocation = async (req, res) => {
  try {
    const { lat, lon } = req.body;

    if (typeof lat !== "number" || typeof lon !== "number") {
      return res.status(400).json({ message: "Missing or invalid lat/lon." });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: "Point",
          coordinates: [lon, lat], // GeoJSON requires [lon, lat]
        },
        manualLocation: true, // optional: if you want to track this
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: "Location updated", location: user.location });
  } catch (err) {
    console.error("Location update failed:", err);
    res.status(500).json({ message: "Failed to update location." });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { username, email, city, country, currentPassword, newPassword } = req.body;

    //  Fetch the user (with password field)
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check that the current password is provided and correct
    if (!currentPassword || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: "Current password is incorrect or missing." });
    }

    // Update basic info
    if (username) user.username = username;
    if (email) user.email = email;
    if (city) user.city = city;
    if (country) user.country = country;

    // If new password is provided, update it
    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    // uploading an avatar and deleting (if necessary) the old one
    if (req.file) {
      // If user already has an avatar, remove it from Cloudinary
      if (user.profilePicture) {
        // Extract public ID from URL
        const publicId = user.profilePicture.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`avatars/${publicId}`);
      }

      // Upload new avatar
      const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: "avatars",
        transformation: [
          {
            width: 300,
            height: 300,
            crop: "fill",
            gravity: "auto",
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      });
      user.profilePicture = result.secure_url;
    }

    // If both city & country are present, geocode them
    if (city && country) {
      try {
        const url = `https://secure.geonames.org/searchJSON?q=${encodeURIComponent(
          city
        )}&country=${country}&maxRows=1&username=${process.env.GEONAMES_USER}`;

        console.log("🌍 Geocoding via GeoNames:", url);

        const geoRes = await fetch(url);
        const geoData = await geoRes.json();
        const geo = geoData.geonames?.[0];

        if (geo) {
          const jitter = () => (Math.random() - 0.5) * 0.02; // jittering users' location on country/city change
          user.location = {
            type: "Point",
            coordinates: [parseFloat(geo.lng) + jitter(), parseFloat(geo.lat) + jitter()],
          };
        } else {
          console.warn("⚠️ No matching GeoNames result found.");
        }
      } catch (geoErr) {
        console.error("🌐 Geocoding failed:", geoErr);
      }
    }

    await user.save();
    // Respond with updated user info (excluding password!)
    const { password, ...safeUser } = user.toObject();
    res.json(safeUser);
  } catch (err) {
    console.error("Failed to update profile:", err);
    res.status(500).json({ message: "Server error while updating profile." });
  }
};

export const getUserStats = async (req, res) => {
  const userId = req.user._id;

  try {
    // Last Swap Date
    const lastCompletedSwap = await SwapProposal.findOne({
      $or: [{ from: userId }, { to: userId }],
      status: "completed",
    })
      .sort({ completedAt: -1 })
      .limit(1);

    const lastSwapDate = lastCompletedSwap?.completedAt || null;

    // Total Books Exchanged
    const totalBooksExchanged = await SwapProposal.countDocuments({
      $or: [{ from: userId }, { to: userId }],
      status: "completed",
    });

    // Most Popular Book
    const popularBooks = await SwapProposal.aggregate([
      { $match: { from: userId } },
      { $group: { _id: "$offeredBook", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "book",
        },
      },
      { $unwind: "$book" },
      {
        $project: {
          title: "$book.title",
          swapCount: "$count",
        },
      },
    ]);

    const mostPopularBook = popularBooks[0] || null;

    // Badges
    const badges = [
      { name: "Bronze Medal 🥉", achieved: totalBooksExchanged >= 1 },
      { name: "Silver Medal 🥈", achieved: totalBooksExchanged >= 5 },
      { name: "Gold Medal 🥇", achieved: totalBooksExchanged >= 10 },
    ];

    // Favorite Genre
    const genreStats = await Book.aggregate([
      { $match: { user: userId } },
      { $group: { _id: "$genre", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    const favoriteGenre = genreStats[0]?._id || null;

    // Oldest Book
    const oldestBookDoc = await Book.findOne({ user: userId })
      .sort({ year: 1 })
      .limit(1)
      .select("title year");

    const oldestBook = oldestBookDoc
      ? { title: oldestBookDoc.title, year: oldestBookDoc.year }
      : null;

    // Add booksCount
    const booksCount = await Book.countDocuments({ user: userId });

    // Final Stats
    const userStats = {
      lastSwapDate,
      totalBooksExchanged,
      mostPopularBook,
      badges,
      favoriteGenre,
      oldestBook,
      booksCount,
    };

    res.json(userStats);
  } catch (err) {
    console.error("Error generating user stats:", err);
    res.status(500).json({ message: "Server error while generating user stats." });
  }
};

export const unflagUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isFlagged && user.flaggedUntil && user.flaggedUntil <= new Date()) {
      // 🚨 Unflag and reset
      user.isFlagged = false;
      user.flaggedUntil = null;
      user.reportedCount = 0;
      await user.save();

      // 1️⃣ Find swaps where this user was flagged
      const reportedSwaps = await SwapProposal.find({
        status: "reported",
        $or: [{ from: userId }, { to: userId }],
      });

      const bookIdsToRestore = new Set();
      for (const swap of reportedSwaps) {
        bookIdsToRestore.add(swap.offeredBook.toString());
        bookIdsToRestore.add(swap.requestedBook.toString());
      }

      // 2️⃣ Restore all these books
      await Book.updateMany(
        { _id: { $in: Array.from(bookIdsToRestore) } },
        { status: "available", reportedAt: null }
      );

      console.log(`✅ User ${user._id} unflagged and all swap-related books restored!`);

      return res.json({ message: "User unflagged and books restored." });
    }

    // Still flagged
    return res.json({
      message: "User is still flagged.",
      flaggedUntil: user.flaggedUntil,
    });
  } catch (err) {
    console.error("Error in unflagUser:", err);
    res.status(500).json({ message: "Failed to unflag user." });
  }
};

export const deleteAccount = async (req, res) => {
  const userId = req.user._id;
  const { password } = req.body;

  // STEP 0: Verify identity first
  const user = await User.findById(userId).select("+password");
  if (!user) return res.status(404).json({ error: "User not found." });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: "Incorrect password." });

  try {
    // STEP 1: Block if user has accepted swaps with one side completed
    const blockingSwap = await SwapProposal.findOne({
      $or: [{ from: userId }, { to: userId }],
      status: "accepted",
      $or: [
        { fromCompleted: true, toCompleted: false },
        { fromCompleted: false, toCompleted: true },
      ],
    });
    if (blockingSwap) {
      return res.status(409).json({
        code: "SWAP_PENDING",
        error: "You must finish all pending swap confirmations before deleting your account.",
      });
    }

    // STEP 2: 🪦 Gather a snapshot for the tombstone
    const [booksCount, completedSwapsCount, userBooks, lastSwap, userMessages] = await Promise.all([
      Book.countDocuments({ user: userId }),
      SwapProposal.countDocuments({
        $or: [{ from: userId }, { to: userId }],
        status: "completed",
      }),
      Book.find({ user: userId }).select("title author year genre").lean(),
      SwapProposal.findOne({
        $or: [{ from: userId }, { to: userId }],
        status: "completed",
      })
        .sort({ completedAt: -1 })
        .select("completedAt")
        .lean(),
      Message.find({ sender: userId }).select("swapId text createdAt").lean(),
    ]);

    await UserTombstone.create({
      originalUserId: userId,
      username: user.username,
      email: user.email,
      country: user.country,
      city: user.city,
      profilePicture: user.profilePicture,
      location: user.location,
      stats: {
        booksCount,
        totalSwaps: completedSwapsCount,
        lastSwapDate: lastSwap?.completedAt || null,
      },
      legacyBooks: userBooks,
      legacyMessages: userMessages,
      reason: "User deleted account",
      deletedAt: new Date(),
    });

    // STEP 3: Cancel all pending/accepted swaps
    await SwapProposal.updateMany(
      {
        $or: [{ from: userId }, { to: userId }],
        status: { $in: ["pending", "accepted"] },
      },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
        },
      }
    );

    // STEP 4: Soft-delete user's books
    await Book.updateMany({ user: userId }, { $set: { status: "deleted" } });

    // STEP 5: Redact messages in live chat & mark senderDeleted
    const REDACTED_TEXT = "[message removed by deleted user]";
    const encryptedRedacted = encryptMessage(REDACTED_TEXT);

    await Message.updateMany(
      { sender: userId },
      {
        $set: {
          text: encryptedRedacted,
          senderDeleted: true,
        },
      }
    );

    // STEP 6: Hard delete the user
    await User.findByIdAndDelete(userId);

    return res.sendStatus(204);
  } catch (err) {
    console.error("❌ Account deletion failed:", err);
    res.status(500).json({ error: "Server error." });
  }
};
