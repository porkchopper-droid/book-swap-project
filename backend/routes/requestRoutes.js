import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { createRequest } from "../controllers/requestController.js";

const router = express.Router();

router.post("/", protect, createRequest); // POST /api/requests

export default router;