import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getUnreadCounts,
  clearUnreadCount,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/unreadCounts", protect, getUnreadCounts);
router.patch("/clearUnread/:swapId", protect, clearUnreadCount);

export default router;
