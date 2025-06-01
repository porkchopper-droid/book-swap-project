import { useState } from "react";
import axios from "axios";
import "./BookModal.scss";

export default function BookModal({
  book,
  onSave,
  onClose,
  onDelete,
  onRevert,
}) {
  const [isbn, setIsbn] = useState(book?.isbn || "");
  const isEdit = Boolean(book);

  const handleFetchISBN = async () => {
    const raw = isbn.trim(); // remove leading/trailing spaces
    if (!raw) return;
    const cleaned = raw.replace(/[-\s]/g, ""); // strip hyphens & internal spaces
    try {
      const { data } = await axios.get(`/api/books/isbn/${cleaned}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setForm((prev) => ({
        ...prev,
        ...data,
        isbn: cleaned, // extra saved
      }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to fetch book data.");
    }
  };

  const [form, setForm] = useState({
    title: book?.title || "",
    author: book?.author || "",
    year: book?.year || "",
    description: book?.description || "",
    genre: book?.genre || "",
    imageUrl: book?.imageUrl || "",
    isbn: book?.isbn || "",
  });

  const handleSubmit = () => {
    const missingFields = [];
    if (!form.title) missingFields.push("Title");
    if (!form.author) missingFields.push("Author");

    if (missingFields.length) {
      alert(`Missing required fields: ${missingFields.join(", ")}`);
      return;
    }
    onSave(form); // let parent handle POST vs PATCH
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{isEdit ? "Edit Book" : "Add Book"}</h3>
        {["title", "author", "year", "genre", "imageUrl"].map((field) => (
          <input
            key={field}
            name={field}
            placeholder={field}
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            className="modal-input"
            disabled={book?.status === "reported" || book?.status === "booked"}
          />
        ))}

        <textarea
          name="description"
          placeholder="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="modal-textarea"
          disabled={book?.status === "reported" || book?.status === "booked"}
        />
        <div className="modal-buttons">
          <div className="isbn-fetch">
            <input
              type="text"
              className="modal-input"
              placeholder="Enter ISBN"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              disabled={
                book?.status === "reported" || book?.status === "booked"
              }
            />
            <button
              onClick={handleFetchISBN}
              disabled={
                book?.status === "reported" || book?.status === "booked"
              }
            >
              Fetch
            </button>
          </div>
          {isEdit && book?.status === "swapped" && (
            <button
              onClick={() => onRevert(book._id)}
              disabled={
                book?.status === "reported" || book?.status === "booked"
              }
            >
              Make Available
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={book?.status === "reported" || book?.status === "booked"}
          >
            {isEdit ? "Save" : "Add"}
          </button>
          {isEdit && book?.status === "available" && (
            <button
              onClick={onDelete}
              disabled={
                book?.status === "reported" || book?.status === "booked"
              }
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
