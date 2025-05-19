import { useNavigate } from "react-router-dom";

import "./SwapCard.scss";

export default function SwapCard({
  swap,
  handleAccept,
  handleDecline,
  handleMarkCompleted,
  handleArchive,
  handleUnarchive,
}) {
  const navigate = useNavigate();

  return (
    <div className={`swap-card ${swap.isArchived ? "greyscale" : ""}`}>
      <p>
        <strong>{swap.offeredBook.title}</strong> ⇄{" "}
        <strong>{swap.requestedBook.title}</strong>
      </p>
      {/* <p>
        {swap.from.username} ⇄ {swap.to.username}
      </p> */}

      {swap.status && (
        <div className={`status-ribbon ${swap.status}`}>
          {swap.status.toUpperCase()}
        </div>
      )}

      {swap.fromMessage && <p>💬 {swap.fromMessage}</p>}
      {swap.toMessage && <p>💬 {swap.toMessage}</p>}
      {swap.isArchived ? (
        <button
          className="unarchive-button"
          onClick={() => handleUnarchive(swap._id)}
        >
          Unarchive
        </button>
      ) : (
        <button onClick={() => navigate(`/chats/${swap._id}`)}>
          Go to Chat
        </button>
      )}
      {swap.status === "pending" && (
        <>
          <button onClick={() => handleAccept(swap._id)}>Accept</button>
          <button onClick={() => handleDecline(swap._id)}>Decline</button>
        </>
      )}

      {swap.status === "accepted" && !swap.isCompleted && (
        <button onClick={() => handleMarkCompleted(swap._id)}>
          Mark Completed
        </button>
      )}

      {swap.isCompleted && !swap.isArchived && (
        <button onClick={() => handleArchive(swap._id)}>Archive</button>
      )}
    </div>
  );
}
