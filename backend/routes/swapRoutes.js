import express from "express";
import { createSwapProposal, respondToSwapProposal, getMySwaps, getSwapById, markSwapAsCompleted, markSwapAsArchived, unarchiveSwap } from "../controllers/swapController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createSwapProposal);
router.patch("/:swapId/respond", protect, respondToSwapProposal);
router.get("/mine", protect, getMySwaps)
router.get("/:swapId", protect, getSwapById)
router.patch("/:swapId/complete", protect, markSwapAsCompleted);
router.patch("/:swapId/archive", protect, markSwapAsArchived);
router.patch("/:swapId/unarchive", protect, unarchiveSwap);



export default router;
