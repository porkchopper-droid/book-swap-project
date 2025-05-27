import { useEffect, useState } from "react";
import "./BooksPage.scss";
import BookCard from "../components/BookCard";
import BookModal from "../components/BookModal";
import axios from "axios";

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [activeTab, setActiveTab] = useState("available");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
  if (showModal || selectedBook) {
    document.body.classList.add("scroll-lock");
  } else {
    document.body.classList.remove("scroll-lock");
  }

  return () => {
    document.body.classList.remove("scroll-lock");
  };
}, [showModal, selectedBook]);

  const tabOptions = [
    { label: "📚 Available", value: "available" },
    { label: "📖 Booked", value: "booked" },
    { label: "🔁 Swapped", value: "swapped" },
    { label: "🚨 Reported", value: "reported" },
  ];

  const handleEditSave = async (updatedFields) => {
    try {
      const { data: updatedBook } = await axios.patch(
        `http://localhost:6969/api/books/${selectedBook._id}`,
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
      setSelectedBook(null);
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
      setShowModal(false);
    } catch (err) {
      console.error("Failed to add book:", err);
    }
  };

  const handleDelete = async () => {
    if (!selectedBook || selectedBook.status !== "available") return;

    try {
      await axios.delete(`http://localhost:6969/api/books/${selectedBook._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setBooks((prevBooks) =>
        prevBooks.filter((b) => b._id !== selectedBook._id)
      );
      setSelectedBook(null);
    } catch (err) {
      console.error("Failed to delete book:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:6969/api/books/mine?status=${activeTab}`, {
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
  }, [activeTab]); // 🔥 triggers re-fetch when tab changes

  return (
    <>
      {error ? (
        <p style={{ color: "red", textAlign: "center" }}>{error}</p>
      ) : (
        <>
          <div className="book-header">
            <button
              className="add-book-button"
              onClick={() => setShowModal(true)}
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
            {loading ? (
              <p>Loading books...</p>
            ) : books.length === 0 ? (
              <p>No books with {activeTab} status.</p>
            ) : (
              books.map((book) => (
                <BookCard
                  key={book._id}
                  book={book}
                  onClick={(book) => setSelectedBook(book)}
                />
              ))
            )}
          </div>

          {(selectedBook || showModal) && (
            <BookModal
              book={selectedBook} // null if adding
              onSave={selectedBook ? handleEditSave : handleAddSave}
              onDelete={handleDelete}
              onClose={() => {
                setSelectedBook(null);
                setShowModal(false);
              }}
            />
          )}
        </>
      )}
    </>
  );
}
