import User from "../models/User.js";
import Book from "../models/Book.js";
import SwapProposal from "../models/SwapProposal.js";
import bcrypt from "bcrypt";

export const getCurrentUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
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
    const { username, email, city, country, currentPassword, newPassword } =
      req.body;

    //  Fetch the user (with password field)
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check that the current password is provided and correct
    if (!currentPassword || !(await user.comparePassword(currentPassword))) {
      return res
        .status(401)
        .json({ message: "Current password is incorrect or missing." });
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
            coordinates: [
              parseFloat(geo.lng) + jitter(),
              parseFloat(geo.lat) + jitter(),
            ],
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
    res
      .status(500)
      .json({ message: "Server error while generating user stats." });
  }
};
