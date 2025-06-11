import SupportMessage from "../models/SupportMessage.js";
import { sendSupportEmail } from "../utils/sendSupportEmail.js";

export const handleSupportRequest = async (req, res) => {
  const { email, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: "Missing email or message." });
  }

  try {
    // Save to DB
    const newSupportMessage = new SupportMessage({ email, message });
    await newSupportMessage.save();

    // Use the helper to send email
    await sendSupportEmail(email, message);

    res.json({ message: "Your message has been sent! We'll reply soon." });
  } catch (error) {
    console.error("❌ Support request failed:", error);
    res.status(500).json({ error: "Failed to send your message. Please try again later." });
  }
};
