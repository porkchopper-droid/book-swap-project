import { useEffect, useState } from "react";
import "./BooksPage.scss";

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingBook, setEditingBook] = useState(null);

  const handleEdit = (book) => {
    setEditingBook(book); // book’s data goes into the modal
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
      <h2>📚 My Books</h2>

      {loading && <p>Loading books...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="books-container">
        {books.map((book) => (
          <div key={book._id} className="book-card">
            <img
              className="book-cover"
              src={
                book.imageUrl && book.imageUrl.trim() !== ""
                  ? book.imageUrl
                  : "/no-cover.png"
              }
              alt={`Cover of ${book.title}`}
            />

            <h3>{book.title}</h3>
            <p>
              <strong>Author:</strong> {book.author}
            </p>
            <p>
              <strong>Year:</strong> {book.year}
            </p>
            <p>
              <strong>Genre:</strong> {book.genre}
            </p>
            <h4 className={`status ${book.status}`}>
              {book.status.toUpperCase()}
            </h4>
          </div>
        ))}
      </div>
    </>
  );
}
