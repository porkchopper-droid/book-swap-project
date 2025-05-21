import { useEffect, useState } from "react";
import "./BooksPage.scss";
import BookCard from "../components/BookCard";

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingBook, setEditingBook] = useState(null);
  const [activeTab, setActiveTab] = useState("available");
  const [editForm, setEditForm] = useState({
    title: "",
    author: "",
    year: "",
    description: "",
    genre: "",
    imageUrl: "",
  });

  const tabOptions = [
    { label: "📚 Available", value: "available" },
    { label: "📖 Booked", value: "booked" },
    { label: "🔁 Swapped", value: "swapped" },
    { label: "🚨 Reported", value: "reported" },
  ];

  const filteredBooks = books.filter((book) => {
    switch (activeTab) {
      case "available":
        return book.status === "available";
      case "booked":
        return book.status === "booked";
      case "swapped":
        return book.status === "swapped";
      case "reported":
        return book.status === "reported";
      default:
        return true; // fallback, show all
    }
  });

  const handleEdit = (book) => {
    setEditingBook(book);
    setEditForm({
      title: book.title,
      author: book.author,
      year: book.year,
      description: book.description,
      genre: book.genre,
      imageUrl: book.imageUrl,
    }); // book’s data goes into the modal
  };

  const handleSave = () => {
    fetch(`http://localhost:6969/api/books/${editingBook._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(editForm),
    })
      .then((res) => res.json())
      .then((updatedBook) => {
        // Replace old book in list with updated one
        setBooks((prevBooks) =>
          prevBooks.map((b) => (b._id === updatedBook._id ? updatedBook : b))
        );
        setEditingBook(null); // close modal
      })
      .catch((err) => {
        console.error("Failed to save book:", err);
      });
  };

  useEffect(() => {
    fetch("http://localhost:6969/api/books/mine", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setBooks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch books:", err);
        setError("Could not load books.");
        setLoading(false);
      });
  }, []);

  return (
    <>
      {loading && <p>Loading books...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="book-tabs">
        {tabOptions.map(({ label, value }) => (
          <button
            key={value}
            className={activeTab === value ? "active" : ""}
            onClick={() => setActiveTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="books-container">
        {filteredBooks.length === 0 ? (
          <p>No books with {activeTab} status.</p>
        ) : (
          filteredBooks.map((book) => (
            <BookCard key={book._id} book={book} onEdit={handleEdit} />
          ))
        )}
      </div>
      {editingBook && (
        <div className="modal-overlay" onClick={() => setEditingBook(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Book</h3>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, title: e.target.value }))
              }
            />

            <input
              type="text"
              value={editForm.author}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, author: e.target.value }))
              }
            />

            <input
              type="text"
              value={editForm.year}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, year: e.target.value }))
              }
            />

            <input
              type="text"
              value={editForm.description}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />

            <input
              type="text"
              value={editForm.genre}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, genre: e.target.value }))
              }
            />

            <input
              type="text"
              value={editForm.imageUrl}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, imageUrl: e.target.value }))
              }
            />

            <button onClick={handleSave}>Save</button>
          </div>
        </div>
      )}
    </>
  );
}
