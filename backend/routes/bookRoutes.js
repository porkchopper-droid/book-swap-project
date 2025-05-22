import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { createBook, getBooks, getNearbyBooks, fetchBookByISBN, getMyBooks, updateBook, deleteBook } from "../controllers/bookController.js";

const router = express.Router();

router.post("/", protect, createBook); // POST /api/books
router.get("/", getBooks);             // GET /api/books
router.get("/nearby", getNearbyBooks); // GET /api/books/nearby
router.get("/isbn/:isbn", protect, fetchBookByISBN); // GET /api/books/isbn/:isbn
router.get("/mine", protect, getMyBooks) // GET all the books
router.patch("/:id", protect, updateBook) // EDITING the book
router.delete("/:id", protect, deleteBook) // DELETING a book


export default router;