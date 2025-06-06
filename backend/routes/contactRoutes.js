import express from "express";
import SupportMessage from "../models/SupportMessage.js";
import { sendSupportEmail } from "../utils/sendSupportEmail.js";

const router = express.Router();

router.post("/contact", async (req, res) => {
  const { email, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: "Missing email or message." });
  }

  try {
    // Save to DB
    const newSupportMessage = new SupportMessage({ email, message });
    await newSupportMessage.save();

    // Send support email
    await sendSupportEmail(email, message);

    res.json({ message: "Your message has been sent! We'll reply soon." });
  } catch (error) {
    console.error("Support request failed:", error);
    res
      .status(500)
      .json({ error: "Failed to send your message. Please try again later." });
  }
});

export default router;
