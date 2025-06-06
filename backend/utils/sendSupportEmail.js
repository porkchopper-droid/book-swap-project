import nodemailer from "nodemailer";

export const sendSupportEmail = async (fromEmail, message) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Bookbook Support Contact" <${process.env.EMAIL_USER}>`,
    to: process.env.NOTIFY_EMAIL, 
    subject: "New Support Request",
    html: `
      <p>Support request from: <strong>${fromEmail}</strong></p>
      <p>Message:</p>
      <p>${message.replace(/\n/g, "<br>")}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Support email sent!");
  } catch (error) {
    console.error("❌ Failed to send support email:", error);
    throw error;
  }
};
