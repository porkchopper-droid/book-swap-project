import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import FlaggedBackground from "./FlaggedBackground";

import axios from "axios";
import "./FlaggedUser.scss"; // optional, for styles

export default function FlaggedUser() {
  const { user, setUser } = useAuth();

  console.log("🟢 User in FlaggedUser component:", user);

  const endDate = user?.flaggedUntil
    ? new Date(user.flaggedUntil).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "unknown";

  // Make a silent background request to /api/users/me to trigger protect
  // useEffect(() => {
  //   const checkFlagStatus = async () => {
  //     try {
  //       const { data } = await axios.get("/api/users/me", {
  //         headers: {
  //           Authorization: `Bearer ${localStorage.getItem("token")}`,
  //         },
  //       });
  //       // Update user state
  //       setUser(data);
  //     } catch (err) {
  //       console.error("Silent flag status check failed:", err);
  //     }
  //   };

  //   checkFlagStatus();
  // }, [setUser]);

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
