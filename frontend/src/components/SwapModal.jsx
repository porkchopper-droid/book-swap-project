import { useEffect } from "react";
import BookCard from "./BookCard.jsx";
import "./SwapModal.scss";

export default function SwapModal({
  myBook,
  theirBook,
  onClose,
  onAccept,
  onDecline,
  onConfirm,
  message,
  setMessage,
  mode = "propose",
}) {
  useEffect(() => {
    document.body.classList.add("scroll-lock");
    return () => {
      document.body.classList.remove("scroll-lock");
    };
  }, []);

  return (
    <div className="swap-modal-overlay" onClick={onClose}>
      <div className="swap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="book-preview">
          <BookCard book={myBook} readOnly />
          <span className="swap-arrow">⇄</span>
          <BookCard book={theirBook} readOnly />
        </div>

        <textarea
          placeholder="Add a message (optional)..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={100}
        />

        <div className="modal-actions">
          {mode === "propose" && (
            <>
              <button className="button-accept" onClick={onConfirm}>
                ✅ Confirm
              </button>
              <button className="button-decline" onClick={onClose}>
                ❌ Cancel
              </button>
            </>
          )}

          {mode === "resolve" && (
            <>
              <button className="button-accept" onClick={onAccept}>
                ✅ Accept
              </button>
              <button className="button-decline" onClick={onDecline}>
                ❌ Decline
              </button>
              <button className="button-cancel" onClick={onClose}>
                ⏳ Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
