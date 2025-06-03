import nodemailer from "nodemailer";

export const sendSwapProposalEmail = async (
  toEmail,
  { recipientUser, sender, offeredBook, requestedBook, fromMessage, link }
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    const mailOptions = {
      from: `"Bookbook" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "New Swap Proposal Pending",
      html: `
        <p>Hello ${recipientUser}!</p>
        <p>${sender} is interested in your <em>${requestedBook}</em> and offering <em>${offeredBook}</em> instead.</p>
        ${
          fromMessage
            ? `<p>Their message:<br><blockquote>${fromMessage}</blockquote></p>`
            : ""
        }
        <p>Visit <a href="${link}">Bookbook</a> to review and respond to the proposal.</p>
        <p>Happy swapping! 😊</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Swap proposal email sent to:", toEmail);
  } catch (error) {
    console.error("❌ Failed to send swap proposal email:", error);
  }
};
