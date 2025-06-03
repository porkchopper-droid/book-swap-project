import { useEffect, useRef, useState } from "react";
import "./BookCard.scss";

export default function BookCard({
  book,
  onClick,
  selected,
  confirmed,
  readOnly = false,
}) {
  const titleRef = useRef();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = titleRef.current;
    if (el && el.scrollWidth > el.clientWidth) {
      setIsOverflowing(true);
    }
  }, [book.title]);

  return (
    <div // CRAZY 🤪
      className={`book-card ${
        selected ? (confirmed ? "selected-confirmed" : "selected-pending") : ""
      } ${readOnly ? "read-only" : ""}`}
      onClick={!readOnly && onClick ? () => onClick(book) : undefined}
    >
      <div className="image-wrapper">
        <img
          className="book-cover"
          src={book.imageUrl?.trim() || "/images/no-cover.png"}
          alt={`Cover of ${book.title}`}
          onLoad={() => setIsImageLoaded(true)}
          onError={() => setIsImageLoaded(true)} // still show ribbon even on fallback
        />
        {/* 💡 Only show the ribbon after image has loaded */}
        {isImageLoaded && (
          <div
            className={`book-status-ribbon ${
              book.pendingSwap ? "pending" : book.status
            }`}
          >
            {book.pendingSwap ? "PENDING SWAP" : book.status.toUpperCase()}
          </div>
        )}
      </div>
      <div className="book-info">
        <div className="title-container" ref={titleRef}>
          <span className={isOverflowing ? "scrolling-title" : "short-title"}>
            {book.title}
          </span>
        </div>

        <p className="book-author">{book.author}</p>
        {/* <p><strong>Year:</strong> {book.year}</p> */}
        {/* <p><strong>Genre:</strong> {book.genre}</p> */}
      </div>
    </div>
  );
}
