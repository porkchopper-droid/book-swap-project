import express from "express";
import { createSwapProposal, respondToSwapProposal, getMySwaps } from "../controllers/swapController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createSwapProposal);
router.patch("/:id/respond", protect, respondToSwapProposal);
router.get("/mine", protect, getMySwaps)

export default router;
