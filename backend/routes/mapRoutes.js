import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getMyLocation } from "../controllers/mapController.js";

const router = express.Router();

router.get("/me/location", protect, getMyLocation);
// router.get("/users", getUsersWithAvailableBooks);


export default router;