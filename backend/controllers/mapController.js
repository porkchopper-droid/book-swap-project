import User from "../models/User.js";

export const getMapUsers = async (req, res) => {
  try {
    const userId = req.user._id;

    const users = await User.aggregate([
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "user",
          as: "books",
        },
      },
      {
        $addFields: {
          books: {
            $filter: {
              input: "$books",
              as: "book",
              cond: { $eq: ["$$book.status", "available"] },
            },
          },
        },
      },
      {
        $match: {
          $or: [
            { "books.0": { $exists: true } }, // users with available books
            { _id: userId }, // OR you (even with 0 books)
          ],
        },
      },
      {
        $addFields: {
          isCurrentUser: { $eq: ["$_id", userId] },
        },
      },
      {
        $project: {
          username: 1,
          location: 1,
          profilePicture: 1,
          isCurrentUser: 1,
          books: 1,
        },
      },
    ]);

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch map users." });
  }
};
