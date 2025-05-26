import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getMapUsers } from "../controllers/mapController.js";

const router = express.Router();

router.get("/users", protect, getMapUsers);


export default router;