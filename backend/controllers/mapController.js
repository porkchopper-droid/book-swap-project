import User from "../models/User.js";

export const getUsersWithAvailableBooks = async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "owner",
          as: "books",
        },
      },
      {
        $match: {
          "books.status": "available",
        },
      },
      {
        $project: {
          username: 1,
          location: 1,
          profilePicture: 1,
          books: {
            $filter: {
              input: "$books",
              as: "book",
              cond: { $eq: ["$$book.status", "available"] },
            },
          },
        },
      },
    ]);

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch map users." });
  }
};

export const getMyLocation = (req, res) => {
  try {
    const user = req.user;                   // already populated by your auth middleware
    const coords = user.location?.coordinates;

    if (!Array.isArray(coords) || coords.length !== 2 || coords.every(n => n === 0)) {
      return res.status(404).json({ message: "No valid location" });
    }
    res.json({ latitude: coords[1], longitude: coords[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not fetch your location" });
  }
};