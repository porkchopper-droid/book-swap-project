import nodemailer from "nodemailer";

export const sendSwapResponseEmail = async (
  toEmail,
  {
    recipientUser,
    responder,
    offeredBook,
    offeredBookAuthor,
    requestedBook,
    requestedBookAuthor,
    toMessage,
    response,
    link,
  }
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
      subject: "Your Swap Proposal Has Been Responded To!",
      html: `
        <p>Hello ${recipientUser}!</p>
        <p>${responder} has <strong>${response}</strong> your swap proposal.</p>
        <p>Swap details:</p>
        <ul>
          <li>Your offer: ${offeredBook} by <em>${offeredBookAuthor}</em></li>
          <li>Your request: ${requestedBook} by <em>${requestedBookAuthor}</em></li>
        </ul>
        ${
          toMessage
            ? `<p>Here's their message:<br><blockquote>${toMessage}</blockquote></p>`
            : ""
        }
        <p>Visit <a href="${link}">Bookbook</a> to see the full swap details.</p>
        <p>Happy swapping! 😊</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Swap response email sent to:", toEmail);
  } catch (error) {
    console.error("❌ Failed to send swap response email:", error);
  }
};
