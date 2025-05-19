import express from "express";
import { createSwapProposal, respondToSwapProposal, getMySwaps, getSwapById } from "../controllers/swapController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createSwapProposal);
router.patch("/:id/respond", protect, respondToSwapProposal);
router.get("/mine", protect, getMySwaps)
router.get("/:id", protect, getSwapById)


export default router;
