import express from "express";
import { registerUser, loginUser, verifyEmail } from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

/* ------------ PUBLIC ROUTES ------------ */
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/verify-email/:token", verifyEmail);

/* ----------- PROTECTED ROUTE ----------- */
router.get("/profile", protect, (req, res) => {
  res.json({
    message: "Welcome to your profile!",
    userId: req.user._id,
  });
});

export default router;
