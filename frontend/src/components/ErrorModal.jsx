import "./ErrorModal.scss";

export default function ErrorModal({ message, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <p>{message}</p>
        <button className="error-modal-button" onClick={onClose}>❌ Close</button>
      </div>
    </div>
  );
}
