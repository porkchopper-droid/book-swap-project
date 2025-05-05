import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { createBook, getBooks } from "../controllers/bookController.js";

const router = express.Router();

router.post("/", protect, createBook); // Add a book
router.get("/", getBooks);             // Get all books (public)

export default router;