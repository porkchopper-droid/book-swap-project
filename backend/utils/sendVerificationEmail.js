import { sendEmail } from "./emailService.js";

export const sendVerificationEmail = async (to, token) => {
  try {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

    const mailOptions = {
      from: `"Bookbook" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Please verify your email address",
      html: `
        <p>Hello,</p>
        <p>Click the link below to verify your email:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>If you didn't sign up for Bookbook, you can safely ignore this email.</p>
      `,
    };

    await sendEmail(mailOptions);
    console.log("✅ Verification email sent to:", to);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error; // re-throw to be caught in registerUser
  }
};