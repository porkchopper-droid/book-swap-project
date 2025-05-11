import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { sendMessage, getMessages } from "../controllers/chatController.js";

const router = express.Router();

router.post("/:swapId", protect, sendMessage);       // POST /api/chats/:swapId
router.get("/:swapId", protect, getMessages);        // GET  /api/chats/:swapId

export default router;
