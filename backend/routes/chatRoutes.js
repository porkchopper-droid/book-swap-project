import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { sendMessage, getMessages } from "../controllers/chatController.js";

const router = express.Router();

router.post("/:swapId", protect, sendMessage);       // POST /api/chat/:swapId
router.get("/:swapId", protect, getMessages);        // GET  /api/chat/:swapId

export default router;
