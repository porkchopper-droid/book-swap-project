import Book from "../models/Book.js";

export const createBook = async (req, res) => {
  try {
    const newBook = new Book({
      ...req.body,
      user: req.user.id, // comes from JWT middleware
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
