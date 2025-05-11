import express from "express"
import { protect } from "../middlewares/authMiddleware.js";
import { updateUserLocation } from "../controllers/userController.js";

const router = express.Router();

router.patch("/update-location", protect, updateUserLocation);

export default router;