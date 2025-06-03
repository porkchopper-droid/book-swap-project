import nodemailer from "nodemailer";

export const sendVerificationEmail = async (to, token) => {
  
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

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
      <p>If you didn’t sign up for Bookbook, you can safely ignore this email.</p>
    `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error; // re-throw to be caught in registerUser
  }
};
