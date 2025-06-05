import { useState, useEffect, useRef } from "react";

import BookOne from "../icons/book-svgrepo-com.svg?react";
import BookTwo from "../icons/book-2-svgrepo-com.svg?react";
import Bookmark from "../icons/book-bookmark-svgrepo-com.svg?react";
import BookmarkMin from "../icons/book-bookmark-minimalistic-svgrepo-com.svg?react";
import BookMin from "../icons/book-minimalistic-svgrepo-com.svg?react";

import "./SVGBackgroundGrid.scss";

const svgComponents = [BookOne, BookTwo, Bookmark, BookmarkMin, BookMin];

const ICON_SIZE = 100; // px

const BookSVGBackgroundGrid = () => {
  const [tiles, setTiles] = useState([]);
  const gridRef = useRef(null);

  const updateTiles = () => {
    const gridContainer = gridRef.current?.parentElement; // 🟢 Parent of `.svg-grid`
    if (!gridContainer) return;

    const { width, height } = gridContainer.getBoundingClientRect();
    const cols = Math.ceil(width / ICON_SIZE) + 1; // Add extra column
    const rows = Math.ceil(height / ICON_SIZE) + 1; // Add extra row

    const newTiles = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const randomIndex = Math.floor(Math.random() * svgComponents.length);
        const Icon = svgComponents[randomIndex];

        // Random jitter values for this icon
        const jitterX = Math.floor(Math.random() * 20) - 10; // -10 to +10 px
        const jitterY = Math.floor(Math.random() * 20) - 10;

        newTiles.push({
          id: `${row}-${col}`,
          top: row * ICON_SIZE,
          left: col * ICON_SIZE,
          jitterX: jitterX,
          jitterY: jitterY,
          Icon: Icon,
        });
      }
    }

    setTiles(newTiles);
  };

  useEffect(() => {
    updateTiles(); // Initial draw

    const observer = new ResizeObserver(() => {
      updateTiles();
    });

    if (gridRef.current?.parentElement) {
      observer.observe(gridRef.current.parentElement);
    }

    window.addEventListener("resize", updateTiles); // Keep for window resizes too

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateTiles);
    };
  }, []);

  return (
    <div ref={gridRef} className="svg-grid">
      {tiles.map((tile) => {
        const IconComponent = tile.Icon;
        return (
          <IconComponent
            key={tile.id}
            className="svg-icon"
            style={{
              top: `${tile.top}px`,
              left: `${tile.left}px`,
              top: `${tile.top + tile.jitterY}px`,
              left: `${tile.left + tile.jitterX}px`,
              position: "absolute",
            }}
          />
        );
      })}
    </div>
  );
};

export default BookSVGBackgroundGrid;
