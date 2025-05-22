import { useEffect, useRef, useState } from "react";
import "./BookCard.scss";

export default function BookCard({ book, onEdit }) {
  const titleRef = useRef();
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = titleRef.current;
    if (el && el.scrollWidth > el.clientWidth) {
      setIsOverflowing(true);
    }
  }, [book.title]);

  return (
    <div className="book-card" onClick={() => onEdit(book)}>
      <div className="image-wrapper">
        <img
          className="book-cover"
          src={book.imageUrl?.trim() || "/no-cover.png"}
          alt={`Cover of ${book.title}`}
        />
        <div className={`swap-status-ribbon ${book.status}`}>
          {book.status.toUpperCase()}
        </div>
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
