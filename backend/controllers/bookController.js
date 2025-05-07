import Book from "../models/Book.js";
import User from "../models/User.js";

export const createBook = async (req, res) => {
  try {
    const newBook = new Book({
      ...req.body,
      user: req.user._id, // comes from JWT middleware
    });

    const saved = await newBook.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create book." });
  }
};

export const getBooks = async (req, res) => {
  try {
    const books = await Book.find().populate("user", "username city country");
    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch books." });
  }
};

export const getNearbyBooks = async (req, res) => {
  try {
    const { lat, lon, radius } = req.query;

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const radiusInMeters = parseFloat(radius) * 1000;

    if (!latitude || !longitude || !radiusInMeters) {
      return res
        .status(400)
        .json({ message: "Missing or invalid lat/lon/radius." });
    }

    // Find users near the given point
    const nearbyUsers = await User.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusInMeters,
        },
      },
    }).select("_id");

    const userIds = nearbyUsers.map((user) => user._id);

    // Find books owned by nearby users
    const books = await Book.find({ user: { $in: userIds } }).populate(
      "user",
      "username city country"
    );

    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch nearby books." });
  }
};
