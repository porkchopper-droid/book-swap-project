import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  updateUserLocation,
  getUserInfo,
  updateUserProfile,
  getUserStats,
  getUserById,
  unflagUser,
  getFullProfile,
  getDailyBooksStats,
  getDailySwapsStats,
  deleteAccount
} from "../controllers/userController.js";
import parser from "../config/multer.js";

const router = express.Router();

router.get("/account", protect, getUserInfo);
router.get("/account/profile", protect, getFullProfile);
router.patch("/account/unflag", protect, unflagUser);
router.patch("/update-location", protect, updateUserLocation);
router.get("/:userId", protect, getUserById);
router.patch("/account/profile", parser.single("avatar"), protect, updateUserProfile);
router.get("/account/stats", protect, getUserStats);
router.get("/account/stats/daily-books", protect, getDailyBooksStats);
router.get("/account/stats/daily-swaps", protect, getDailySwapsStats);
router.delete("/account", protect, deleteAccount);


export default router;
