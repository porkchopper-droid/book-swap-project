import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import "./SwapCard.scss";

export default function SwapCard({
  swap,
  handleAccept,
  handleDecline,
  handleMarkCompleted,
  handleArchive,
  handleUnarchive,
}) {
  const [hoveringRibbon, setHoveringRibbon] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // testing who is who during the swap
  const isUserFrom = user._id === swap.from._id;
  const hasUserMarkedCompleted = isUserFrom
    ? swap.fromCompleted
    : swap.toCompleted;
  const hasUserArchived = isUserFrom ? swap.fromArchived : swap.toArchived;

    const showReport =
    swap.status === "accepted" &&
    !swap.isCompleted &&
    !hasUserMarkedCompleted &&
    (isUserFrom ? swap.toCompleted : swap.fromCompleted);

  let ribbonText = swap.status.toUpperCase();
  let ribbonClass = swap.status;

  if (swap.status === "accepted") {
    const userCompleted = hasUserMarkedCompleted;
    const otherCompleted = isUserFrom ? swap.toCompleted : swap.fromCompleted;

    if (hasUserArchived && swap.isCompleted) {
      ribbonText = "ARCHIVED";
    } else if (swap.isCompleted) {
      ribbonText = "COMPLETED";
      ribbonClass = "completed";
    } else if (userCompleted && !otherCompleted) {
      ribbonText = "WAITING FOR OTHER USER";
      ribbonClass = "waiting";
    } else if (!userCompleted && otherCompleted) {
      ribbonText = "PENDING YOUR APPROVAL";
      ribbonClass = "waiting";
    }
  }

  return (
    <div className={`swap-card ${hasUserArchived ? "greyscale" : ""}`}>
      <p>
        <strong>{swap.offeredBook.title}</strong> ⇄{" "}
        <strong>{swap.requestedBook.title}</strong>
      </p>
      {/* <p>
        {swap.from.username} ⇄ {swap.to.username}
      </p> */}

       <div
      className={`status-ribbon ${ribbonClass}`}
      onMouseEnter={() => setHoveringRibbon(true)}
      onMouseLeave={() => setHoveringRibbon(false)}
      onClick={() => {
        if (showReport) {
          // show confirmation / send report
          handleReport(swap._id);
        }
      }}
      style={{ cursor: showReport ? "pointer" : "default" }}
    >
      {showReport && hoveringRibbon ? "REPORT" : ribbonText}
    </div>

      {swap.fromMessage && (
        <p className="swap-message">💬 {swap.fromMessage}</p>
      )}
      {swap.toMessage && <p className="swap-message">💬 {swap.toMessage}</p>}

      {!hasUserArchived &&
        swap.status !== "declined" &&
        swap.status !== "pending" && (
          <button onClick={() => navigate(`/chats/${swap._id}`)}>
            Go to Chat
          </button>
        )}
      {swap.status === "pending" && user?._id === swap.to._id && (
        <>
          <button onClick={() => handleAccept(swap._id)}>Accept</button>
          <button onClick={() => handleDecline(swap._id)}>Decline</button>
        </>
      )}

      {swap.status === "accepted" && !hasUserMarkedCompleted && (
        <button onClick={() => handleMarkCompleted(swap._id)}>
          Mark as Completed
        </button>
      )}

      {swap.isCompleted && !hasUserArchived && (
        <button onClick={() => handleArchive(swap._id)}>Archive</button>
      )}

      {swap.isCompleted && hasUserArchived && (
        <button onClick={() => handleUnarchive(swap._id)}>Unarchive</button>
      )}
    </div>
  );
}
