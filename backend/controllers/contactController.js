import SupportMessage from "../models/SupportMessage.js";
import { sendSupportEmail } from "../utils/sendSupportEmail.js";

export const handleSupportRequest = async (req, res) => {
  const { email, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({
      success: false,
      code: "MISSING_FIELDS",
      message: "Both email and message are required.",
    });
  }

  try {
    // Save to DB
    const saved = await SupportMessage.create({ email, message });

    // Use the helper to send email
    await sendSupportEmail(email, message);

    return res.status(200).json({
      success: true,
      code: "SUPPORT_MESSAGE_SENT",
      message: "Thanks! Your message has been received. We'll get back to you soon.",
    });
  } catch (error) {
    console.error("❌ Support request failed:", error);
    return res.status(500).json({
      success: false,
      code: "SUPPORT_REQUEST_FAILED",
      message: "Something went wrong while sending your message. Please try again later.",
    });
  }
};
