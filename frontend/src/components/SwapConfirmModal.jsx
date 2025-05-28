import { useEffect } from "react";
import "./SwapConfirmModal.scss";

export default function SwapConfirmModal({
  myBook,
  theirBook,
  onClose,
  onConfirm,
  message,
  setMessage,
}) {
  useEffect(() => {
    document.body.classList.add("scroll-lock");
    return () => {
      document.body.classList.remove("scroll-lock");
    };
  }, []);

  return (
    <div className="swap-modal-overlay">
      <div className="swap-modal">
        <div className="book-preview">
          <img src={myBook.imageUrl} alt={myBook.title} />
          <span className="swap-arrow">⇄</span>
          <img src={theirBook.imageUrl} alt={theirBook.title} />
        </div>

        <textarea
          placeholder="Add a message (optional)..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={300}
        />

        <div className="modal-actions">
          <button onClick={onConfirm}>✅ Confirm</button>
          <button onClick={onClose}>❌ Cancel</button>
        </div>
      </div>
    </div>
  );
}
