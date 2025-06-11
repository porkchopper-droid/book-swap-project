import { useState } from "react";
import { Link } from "react-router-dom";
import "./AboutUs.scss";

export default function AboutUsPage() {
  const [showQRModal, setShowQRModal] = useState(false);

  return (
    <>
      {showQRModal && (
        <div className="qr-modal-overlay" onClick={() => setShowQRModal(false)}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <img src="/bmc_qr.png" alt="Buy Me a Coffee QR code" />
            <p>Thank you for your support! 🍕</p>
            <button onClick={() => setShowQRModal(false)}>Close</button>
          </div>
        </div>
      )}
      <div className="about-us-page">
        <h1>About Us</h1>
        <p>
          BookBook is a swapping platform and a community of passionate readers sharing their
          books wherever they are, making friends in between.
        </p>
        <p>
          Our mission: to make book swapping seamless, personal, and fun — whether you're in Berlin
          or Bangkok, we're here to help you discover your next favorite read.
        </p>
        <p>
          We’d be delighted if you <Link to="/contact-us">dropped us a line</Link>. Or even better —
          if you enjoy the project, a cup of coffee would be{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setShowQRModal(true);
            }}
          >
            appreciated
          </a>
          .
        </p>
        <p>Happy swapping! 📚</p>
      </div>
    </>
  );
}
