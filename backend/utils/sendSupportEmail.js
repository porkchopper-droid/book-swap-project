import { sendEmail } from "./emailService.js";

export const sendSupportEmail = async (email, message) => {
  const mailOptions = {
    from: `"Bookbook Support" <${process.env.EMAIL_USER}>`,
    to: process.env.NOTIFY_EMAIL,
    subject: "New Support Request",
    html: `<p>Support request from: <strong>${email}</strong></p><p>${message.replace(/\n/g, "<br>")}</p>`,
  };

  await sendEmail(mailOptions);
};