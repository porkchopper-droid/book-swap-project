import Request from "../models/Request.js";
import Book from "../models/Book.js";

export const createRequest = async (req, res) => {
  try {
    const { bookId, message } = req.body;

    // 1. Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }

    // 2. Prevent user from requesting their own book
    if (book.user.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot request your own book." });
    }

    // 3. Create the request
    const newRequest = new Request({
      book: book._id,
      from: req.user.id,
      to: book.user,
      message
    });

    const saved = await newRequest.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create request." });
  }
};