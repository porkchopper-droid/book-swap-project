import { sendEmail } from "./emailService.js";

export const sendCronEmail = async (subject, text) => {
  const mailOptions = {
    from: `"Bookbook Cron" <${process.env.EMAIL_USER}>`,
    to: process.env.NOTIFY_EMAIL,
    subject,
    text,
  };

  await sendEmail(mailOptions);
};
