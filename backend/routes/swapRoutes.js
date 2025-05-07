import express from "express";
import { createSwapProposal } from "../controllers/swapController.js";
import { respondToSwapProposal } from "../controllers/swapController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createSwapProposal);
router.patch("/:id/respond", protect, respondToSwapProposal);

export default router;
