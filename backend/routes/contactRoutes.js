import express from "express";
import { handleSupportRequest } from "../controllers/contactController.js";

const router = express.Router();

router.post("/contact", handleSupportRequest);

export default router;
