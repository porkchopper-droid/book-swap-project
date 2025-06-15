import axios from "axios";

import Book from "../models/Book.js";
import User from "../models/User.js";
import SwapProposal from "../models/SwapProposal.js";

export const createBook = async (req, res) => {
  try {
    const saved = await Book.create({
      ...req.body,
      user: req.user._id, // comes from JWT middleware
      createdBy: req.user._id,
      isbn: req.body.isbn,
    });

    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create book." });
  }
};

export const getNearbyBooks = async (req, res) => {
  try {
    const { lat, lon, radius } = req.query;

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const radiusInMeters = parseFloat(radius) * 1000;

    if (!latitude || !longitude || !radiusInMeters) {
      return res.status(400).json({ message: "Missing or invalid lat/lon/radius." });
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
    const books = await Book.find({ user: { $in: userIds }, status: { $ne: "deleted" } }).populate(
      "user",
      "username city country"
    );

    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch nearby books." });
  }
};

export const fetchBookByISBN = async (req, res) => {
  const { isbn } = req.params;
  try {
    if (!/^\d{10}(\d{3})?$/.test(isbn)) {
      return res.status(400).json({ message: "Invalid ISBN format" });
    }

    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);

    const book = response.data.items?.[0]?.volumeInfo;
    if (!book) {
      return res.status(404).json({ message: "No book found for that ISBN." });
    }

    res.json({
      title: book.title || "",
      author: book.authors?.join(", ") || "",
      year: book.publishedDate?.substring(0, 4) || "",
      description: book.description || "",
      genre: book.categories?.[0] || "",
      imageUrl: book.imageLinks?.thumbnail || "",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch book data." });
  }
};

export const getMyBooks = async (req, res) => {
  try {
    const filters = { user: req.user._id };

    if (req.query.status) {
      // caller wants a specific status (could even be "deleted")
      filters.status = req.query.status;
    } else {
      // default: everything except "deleted"
      filters.status = { $ne: "deleted" };
    }

    const books = await Book.find(filters);

    // Get all pending swaps involving this user
    const pendingProposals = await SwapProposal.find({
      status: "pending",
      $or: [{ from: req.user._id }, { to: req.user._id }],
    });

    const involvedBookIds = new Set();
    pendingProposals.forEach((proposal) => {
      involvedBookIds.add(proposal.offeredBook.toString());
      involvedBookIds.add(proposal.requestedBook.toString());
    });

    const enrichedBooks = books.map((book) => ({
      ...book.toObject(),
      pendingSwap: involvedBookIds.has(book._id.toString()),
    }));

    res.json(enrichedBooks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch your books." });
  }
};

export const getUserBooks = async (req, res) => {
  try {
    const filters = { user: req.params.userId };

     if (req.query.status) {
      // caller wants a specific status (could even be "deleted")
      filters.status = req.query.status;
    } else {
      // default: everything except "deleted"
      filters.status = { $ne: "deleted" };
    }

    const books = await Book.find(filters);

    // Find pending swap proposals where this user is involved
    const pendingProposals = await SwapProposal.find({
      status: "pending",
      $or: [{ from: req.params.userId }, { to: req.params.userId }],
    });

    const involvedBookIds = new Set();
    pendingProposals.forEach((proposal) => {
      involvedBookIds.add(proposal.offeredBook.toString());
      involvedBookIds.add(proposal.requestedBook.toString());
    });

    // Enrich books with pendingSwap: true
    const enrichedBooks = books.map((book) => ({
      ...book.toObject(),
      pendingSwap: involvedBookIds.has(book._id.toString()),
    }));

    res.json(enrichedBooks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user's books." });
  }
};

export const updateBook = async (req, res) => {
  try {
    // Find the book by ID
    const book = await Book.findById(req.params.bookId);

    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }

    // Check ownership
    if (!book.user.equals(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to edit this book." });
    }

    // Optional: prevent editing reported/booked/swapped books
    if (["reported", "booked"].includes(book.status)) {
      return res.status(400).json({ message: "Cannot edit a book that is reported or booked." });
    }

    // Actually update the book fields
    // Only allow specific fields to be updated
    const allowedFields = ["title", "author", "year", "description", "genre", "imageUrl", "isbn"];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        book[field] = req.body[field];
      }
    }

    await book.save();

    res.json(book);
  } catch (err) {
    console.error("Failed to update book:", err);
    res.status(500).json({ message: "Failed to update book." });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);

    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }

    if (!book.user.equals(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to delete this book." });
    }

    book.status = "deleted";
    await book.save();
    res.json({ message: "Book deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete book." });
  }
};

export const revertBookToAvailable = async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);

    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }

    if (!book.user.equals(req.user._id)) {
      return res.status(403).json({ message: "Not authorized." });
    }

    // Optional check: only allow if book is currently swapped
    if (book.status !== "swapped") {
      return res.status(400).json({ message: "Book is not in swapped status." });
    }

    book.status = "available";
    await book.save();

    res.json({ message: "Book reverted to available.", book });
  } catch (err) {
    console.error("Failed to revert book:", err);
    res.status(500).json({ message: "Server error." });
  }
};
