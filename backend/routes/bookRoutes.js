import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { createBook, getBooks, getNearbyBooks } from "../controllers/bookController.js";

const router = express.Router();

router.post("/", protect, createBook); // POST /api/books
router.get("/", getBooks);             // GET /api/books
router.get("/nearby", getNearbyBooks); // GET /api/books/nearby

export default router;