import express from "express";
import { getUsersWithAvailableBooks } from "../controllers/mapController.js";

const router = express.Router();

router.get("/users", getUsersWithAvailableBooks);

export default router;