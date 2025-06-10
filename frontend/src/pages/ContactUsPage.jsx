import { useState } from "react";
import axios from "axios";
import ContactUsBackground from "../components/ContactUsBackground";
import "./ContactUsPage.scss"; // optional for styling

export default function ContactUsPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/support/contact", { email, message });
      setStatus("Your message has been sent! We'll reply soon.");
      setEmail("");
      setMessage("");
    } catch (err) {
      console.error(err);
      setStatus("Failed to send. Please try again later.");
    }
  };

  return (
    <div className="contact-us-wrapper">
      <ContactUsBackground />
      <div className="contact-us">
        <h2>Contact Us</h2>
        <form onSubmit={handleSubmit}>
          <input
            id="email"
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <textarea
            id="message"
            placeholder="A penny for your thoughts..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          {status ? (
            <p className="status">{status}</p>
          ) : (
            <button type="submit">Send Message</button>
          )}
        </form>
      </div>
    </div>
  );
}
