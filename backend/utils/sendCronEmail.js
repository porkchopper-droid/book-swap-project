import nodemailer from "nodemailer";

export const sendEmail = async ({ subject, text }) => {
  
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Bookbook Cron" <${process.env.EMAIL_USER}>`,
    to: process.env.NOTIFY_EMAIL,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
};