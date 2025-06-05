import { useState, useEffect, useRef } from "react";

import CallIcon from "../icons/chat-round-call-svgrepo-com.svg?react";
import CheckIcon from "../icons/chat-round-check-svgrepo-com.svg?react";
import DotsIcon from "../icons/chat-round-dots-svgrepo-com.svg?react";
import LikeIcon from "../icons/chat-round-like-svgrepo-com.svg?react";
import LineIcon from "../icons/chat-round-line-svgrepo-com.svg?react";
import UnreadIcon from "../icons/chat-round-unread-svgrepo-com.svg?react";

import "./SVGBackgroundGrid.scss";

const svgComponents = [
  CallIcon,
  CheckIcon,
  DotsIcon,
  LikeIcon,
  LineIcon,
  UnreadIcon,
];

const ICON_SIZE = 100; // px

const SVGBackgroundGrid = ({ animate }) => {
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
    <div ref={gridRef} className={`svg-grid ${animate ? "animated" : ""}`}>
      {tiles.map((tile) => {
        const IconComponent = tile.Icon;
        const delay = `${Math.random() * 2}s`; // random 0–2 seconds delay
        return (
          <IconComponent
            key={tile.id}
            className="svg-icon"
            style={{
              top: `${tile.top + tile.jitterY}px`,
              left: `${tile.left + tile.jitterX}px`,
              position: "absolute",
              animationDelay: delay, // 👈 random delay
            }}
          />
        );
      })}
    </div>
  );
};

export default SVGBackgroundGrid;
