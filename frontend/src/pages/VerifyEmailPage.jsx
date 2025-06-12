import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "./VerifyEmailPage.scss";

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [message, setMessage] = useState("Verifying email...");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await axios.get(`/api/auth/verify-email/${token}`);
        // Use the response message directly!
        setMessage(`✅ ${res.data.message}`);
      } catch (err) {
        console.error("Verification failed:", err);
        setMessage("❌ Verification failed. The link may be expired or already used.");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="verify-email-page">
      <h2>{message}</h2>
      <Link to="/" className="back-link">
        🔙 Back to Home / Login
      </Link>
    </div>
  );
}
