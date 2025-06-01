import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createBook,
  fetchBookByISBN,
  getMyBooks,
  updateBook,
  deleteBook,
  getUserBooks,
  revertBookToAvailable
} from "../controllers/bookController.js";

const router = express.Router();

// Protect and get books
router.post("/", protect, createBook); // POST /api/books

// Special lookups
router.get("/isbn/:isbn", protect, fetchBookByISBN); // GET /api/books/isbn/:isbn

// Book ownership
router.get("/mine", protect, getMyBooks); // GET all the books
router.get("/users/:userId", protect, getUserBooks); // GET all user's books

// Single book operations
router.patch("/:bookId", protect, updateBook); // EDITING the book
router.delete("/:bookId", protect, deleteBook); // DELETING a book
router.patch("/:bookId/available", protect, revertBookToAvailable); // PATCH  /api/books/:bookId/available


export default router;
