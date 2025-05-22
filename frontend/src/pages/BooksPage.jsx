import { useEffect, useState } from "react";
import "./BooksPage.scss";
import BookCard from "../components/BookCard";
import BookModal from "../components/BookModal";
import axios from "axios";

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingBook, setEditingBook] = useState(null);
  const [activeTab, setActiveTab] = useState("available");
  const [showAddModal, setShowAddModal] = useState(false);

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

  const handleEditSave = async (updatedFields) => {
    try {
      const { data: updatedBook } = await axios.patch(
        `http://localhost:6969/api/books/${editingBook._id}`,
        updatedFields,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setBooks((prevBooks) =>
        prevBooks.map((b) => (b._id === updatedBook._id ? updatedBook : b))
      );
      setEditingBook(null);
    } catch (err) {
      console.error("Failed to update book:", err);
    }
  };

  const handleAddSave = async (newBook) => {
    try {
      const { data: createdBook } = await axios.post(
        "http://localhost:6969/api/books",
        newBook,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setBooks((prevBooks) => [...prevBooks, createdBook]);
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to add book:", err);
    }
  };

  const handleDelete = async () => {
    if (!editingBook || editingBook.status !== "available") return;

    try {
      await axios.delete(`http://localhost:6969/api/books/${editingBook._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setBooks((prevBooks) =>
        prevBooks.filter((b) => b._id !== editingBook._id)
      );
      setEditingBook(null);
    } catch (err) {
      console.error("Failed to delete book:", err);
    }
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

      <div className="book-header">
        <button
          className="add-book-button"
          onClick={() => setShowAddModal(true)}
        >
          ✍️ Add Book
        </button>

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
      </div>

      <div className="books-container">
        {filteredBooks.length === 0 ? (
          <p>No books with {activeTab} status.</p>
        ) : (
          filteredBooks.map((book) => (
            <BookCard
              key={book._id}
              book={book}
              onEdit={(book) => setEditingBook(book)}
            />
          ))
        )}
      </div>
      {(editingBook || showAddModal) && (
        <BookModal
          book={editingBook} // null if adding
          onSave={editingBook ? handleEditSave : handleAddSave}
          onDelete={handleDelete}
          onClose={() => {
            setEditingBook(null);
            setShowAddModal(false);
          }}
        />
      )}
    </>
  );
}
