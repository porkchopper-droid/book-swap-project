import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  updateUserLocation,
  getCurrentUserInfo,
  updateUserProfile,
  getUserStats
} from "../controllers/userController.js";

const router = express.Router();

router.patch("/update-location", protect, updateUserLocation);
router.get("/me", protect, getCurrentUserInfo);
router.patch("/me", protect, updateUserProfile);
router.get("/me/stats", protect, getUserStats);

export default router;
