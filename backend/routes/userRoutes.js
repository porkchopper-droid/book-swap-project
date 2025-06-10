import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  updateUserLocation,
  getCurrentUserInfo,
  updateUserProfile,
  getUserStats,
  getUserById,
  unflagUser,
  getFullProfile,
  getDailyBooksStats,
  getDailySwapsStats,
} from "../controllers/userController.js";
import parser from "../config/multer.js";

const router = express.Router();

router.get("/account", protect, getCurrentUserInfo);
router.get("/account/profile", protect, getFullProfile);
router.patch("/account/unflag", protect, unflagUser);
router.patch("/update-location", protect, updateUserLocation);
router.get("/:userId", protect, getUserById);
router.patch("/account", parser.single("avatar"), protect, updateUserProfile);
router.get("/account/stats", protect, getUserStats);
router.get("/account/stats/daily-books", protect, getDailyBooksStats);
router.get("/account/stats/daily-swaps", protect, getDailySwapsStats);

export default router;
