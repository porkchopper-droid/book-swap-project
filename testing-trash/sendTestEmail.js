import dotenv from "dotenv";
import { sendEmail } from "../backend/utils/sendEmail.js";

dotenv.config();

(async () => {
  try {
    await sendEmail({
      subject: "📬 Bookbook Cron Test Email",
      text: `Hey! This is a test to confirm your email setup is working.

If you're reading this, everything's ready for liftoff 🚀

– Your friendly Bookbook Cron`,
    });

    console.log("✅ Test email sent successfully.");
  } catch (err) {
    console.error("❌ Failed to send test email:", err.message);
  }
})();
