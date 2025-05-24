import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  sendMessage,
  getMessages,
  getMyChats,
} from "../controllers/chatController.js";

const router = express.Router();

router.get("/mine", protect, getMyChats); // GET  /api/chats/mine
router.get("/:swapId", protect, getMessages); // GET  /api/chats/:swapId
router.post("/:swapId", protect, sendMessage); // POST /api/chats/:swapId

export default router;
