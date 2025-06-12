import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import FlaggedBackground from "./FlaggedBackground";
import { debugLog } from "../utils/debug.js";

import axios from "axios";
import "./FlaggedUser.scss"; // optional, for styles

export default function FlaggedUser() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

   debugLog("🟢 User in FlaggedUser component:", user);

  const endDate = user?.flaggedUntil
    ? new Date(user.flaggedUntil).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "unknown";

  useEffect(() => {
    const checkFlagStatus = async () => {
      try {
        // 1️⃣ Trigger unflag
        await axios.patch(
          "/api/users/account/unflag",
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        // 2️⃣ Fetch fresh user data
        const res = await axios.get("/api/users/account", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Silent flag status check failed:", err);
      }
    };

    checkFlagStatus();
  }, [setUser]);

  // This kicks user out of FlaggedUser page when they’re no longer flagged
  useEffect(() => {
    if (user && !user.isFlagged) {
      navigate("/account");
    }
  }, [user, navigate]);

  return (
    <div className="flagged-background">
      <FlaggedBackground />
      <div className="flagged-info">
        <h2>Account Restricted</h2>
        <p>
          Your account has been temporarily restricted due to multiple reports.
          There is a 7-day cooldown period ending on {endDate}.
        </p>
        <p>
          If you believe this was a mistake,{" "}
          <Link to="/contact-us" className="contact-link">
            contact us
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
