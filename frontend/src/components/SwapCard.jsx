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
  handleReport,
  handleCancelSwap,
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
    swap.status !== "completed" &&
    !hasUserMarkedCompleted &&
    (isUserFrom ? swap.toCompleted : swap.fromCompleted);

  const showCancel = swap.status === "pending" && user._id === swap.from._id;

  let ribbonText = swap.status.toUpperCase();
  let ribbonClass = swap.status;

  if (swap.status === "completed") {
    if (hasUserArchived) {
      ribbonText = "ARCHIVED";
    } else {
      ribbonText = "COMPLETED";
      ribbonClass = "completed";
    }
  } else if (swap.status === "accepted") {
    const userCompleted = hasUserMarkedCompleted;
    const otherCompleted = isUserFrom ? swap.toCompleted : swap.fromCompleted;

    if (userCompleted && !otherCompleted) {
      ribbonText = "WAITING FOR OTHER USER";
      ribbonClass = "waiting";
    } else if (!userCompleted && otherCompleted) {
      ribbonText = "PENDING YOUR APPROVAL";
      ribbonClass = "waiting";
    }
  } else if (swap.status === "expired") {
    ribbonText = "EXPIRED";
    ribbonClass = "expired";
  }

  if (swap.status === "cancelled") {
    ribbonText = "CANCELLED";
    ribbonClass = "cancelled";
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
        className={`swap-status-ribbon ${ribbonClass}`}
        onMouseEnter={() => setHoveringRibbon(true)}
        onMouseLeave={() => setHoveringRibbon(false)}
        onClick={() => {
          if (showCancel) {
            handleCancelSwap(swap._id);
          } else if (showReport) {
            // TODO: show confirmation / send report
            handleReport(swap._id);
          }
        }}
        style={{
          cursor: showCancel || showReport ? "pointer" : "default",
        }}
      >
        {hoveringRibbon && (showCancel || showReport)
          ? showCancel
            ? "CANCEL"
            : "REPORT"
          : ribbonText}
      </div>

      {swap.fromMessage && (
        <p className="swap-message">💬 {swap.fromMessage}</p>
      )}
      {swap.toMessage && <p className="swap-message">💬 {swap.toMessage}</p>}

      {!hasUserArchived &&
        swap.status !== "declined" &&
        swap.status !== "pending" &&
        swap.status !== "expired" && 
        swap.status !== "cancelled" && (
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

      {swap.status === "completed" && !hasUserArchived && (
        <button onClick={() => handleArchive(swap._id)}>Archive</button>
      )}

      {swap.status === "completed" && hasUserArchived && (
        <button onClick={() => handleUnarchive(swap._id)}>Unarchive</button>
      )}
    </div>
  );
}
