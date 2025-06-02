import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import BookCard from "../components/BookCard";
import ErrorModal from "../components/ErrorModal";
import SwapModal from "../components/SwapModal";
import "./SwapProposal.scss";

export default function SwapPage() {
  const { userId } = useParams();
  const [myBooks, setMyBooks] = useState([]);
  const [theirBooks, setTheirBooks] = useState([]);
  const [theirName, setTheirName] = useState("Unknown");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [mySelectedBook, setMySelectedBook] = useState(null);
  const [theirSelectedBook, setTheirSelectedBook] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [swapMessage, setSwapMessage] = useState("");

  useEffect(() => {
    if (errorMessage) {
      document.body.classList.add("scroll-lock");
    } else {
      document.body.classList.remove("scroll-lock");
    }

    return () => {
      document.body.classList.remove("scroll-lock");
    };
  }, [errorMessage]);

  useEffect(() => {
    if (userId) {
      axios
        .get(`/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        .then((res) => setTheirName(res.data.username || "Unknown"))
        .catch((err) => console.error("Failed to load user info", err));
    }
  }, [userId]);

  useEffect(() => {
    fetchBooks();
  }, [userId]);

  const fetchBooks = async () => {
    try {
      const [mine, theirs] = await Promise.all([
        axios.get("/api/books/mine?status=available", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
        axios.get(`/api/books/users/${userId}?status=available`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
      ]);
      setMyBooks(mine.data);
      setTheirBooks(theirs.data);
    } catch (err) {
      console.error("Failed to load books", err);
      setError("Could not load books.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmProposal = async () => {
    try {
      await axios.post(
        "/api/swaps",
        {
          to: userId,
          offeredBook: mySelectedBook._id,
          requestedBook: theirSelectedBook._id,
          fromMessage: swapMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      alert("Swap proposed successfully!");
      setMySelectedBook(null);
      setTheirSelectedBook(null);
      setSwapMessage("");
      setShowModal(false);
      await fetchBooks();
    } catch (err) {
      console.error("Failed to propose swap", err);
      setErrorMessage(err.response?.data?.message || "Something went wrong.");
      setShowModal(false);
    }
  };

  return loading || error ? (
    <p style={{ color: error ? "red" : "inherit", textAlign: "center" }}>
      {error || "Loading swap candidates..."}
    </p>
  ) : (
    <>
      <h2>🔄 Swap with {theirName}</h2>

      <div className="swap-controls">
        <button
          className={mySelectedBook && theirSelectedBook ? "active" : ""}
          disabled={!mySelectedBook || !theirSelectedBook}
          onClick={() => setShowModal(true)}
        >
          🔄 Propose Swap
        </button>
        <button
          className={mySelectedBook || theirSelectedBook ? "active" : ""}
          onClick={() => {
            setMySelectedBook(null);
            setTheirSelectedBook(null);
          }}
          disabled={!mySelectedBook && !theirSelectedBook}
        >
          🔁 Reset
        </button>
        <button onClick={() => window.history.back()}>❌ Cancel</button>
      </div>

      <div className="swap-grid">
        <div className="book-column">
          <h3>📕 My Books</h3>
          <div className="book-list">
            {myBooks.map((book) => (
              <BookCard
                key={book._id}
                book={book}
                onClick={() =>
                  setMySelectedBook(
                    mySelectedBook?._id === book._id ? null : book
                  )
                }
                selected={mySelectedBook?._id === book._id}
                confirmed={!!theirSelectedBook}
              />
            ))}
          </div>
        </div>

        <div className="book-column">
          <h3>📘 Their Books</h3>
          <div className="book-list">
            {theirBooks.map((book) => (
              <BookCard
                key={book._id}
                book={book}
                onClick={() =>
                  setTheirSelectedBook(
                    theirSelectedBook?._id === book._id ? null : book
                  )
                }
                selected={theirSelectedBook?._id === book._id}
                confirmed={!!mySelectedBook}
              />
            ))}
          </div>
        </div>
      </div>
      {errorMessage && (
        <ErrorModal
          message={errorMessage}
          onClose={() => setErrorMessage("")}
        />
      )}
      {showModal && (
        <SwapModal
          myBook={mySelectedBook}
          theirBook={theirSelectedBook}
          message={swapMessage}
          setMessage={setSwapMessage}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirmProposal}
        />
      )}
    </>
  );
}
