import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createRequest,
  getIncomingRequests,
  getOutgoingRequests,
  updateRequestStatus,
} from "../controllers/requestController.js";

const router = express.Router();

router.post("/", protect, createRequest); // POST /api/requests
router.get("/incoming", protect, getIncomingRequests); // GET /api/requests/incoming
router.get("/outgoing", protect, getOutgoingRequests); // GET /api/requests/outgoing
router.patch("/:id", protect, updateRequestStatus); // PATCH /api/requests/:id

export default router;
