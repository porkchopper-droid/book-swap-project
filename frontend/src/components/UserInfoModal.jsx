import { useState } from "react";
import axios from "axios";
import "./BookModal.scss"; // reuse same style for now

export default function UserInfoModal({ user, onClose, onUpdate }) {
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    city: user?.city || "",
    country: user?.country || "",
  });

  const handleSubmit = async () => {
    try {
      const { data } = await axios.patch("/api/users/me", form, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      onUpdate(data); // send updated info back to MyAccount
      onClose();
    } catch (err) {
      alert("Failed to update user info");
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Your Info</h3>
        {["username", "email", "city", "country"].map((field) => (
          <input
            key={field}
            name={field}
            placeholder={field}
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            className="modal-input"
          />
        ))}

        <div className="modal-buttons">
          <button onClick={handleSubmit}>Save</button>
        </div>
      </div>
    </div>
  );
}
