import { useState, useEffect, useRef } from "react";

import LetterOne from "../icons/letter-opened-svgrepo-com.svg?react";
import LetterTwo from "../icons/letter-svgrepo-com.svg?react";
import LetterThree from "../icons/letter-unread-svgrepo-com.svg?react";

import "./ContactUsBackground.scss";

const svgComponents = [LetterOne, LetterTwo, LetterThree];

const ICON_SIZE = 150; // px

const ContactUsBackground = () => {
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
    <div ref={gridRef} className="contact-us-grid">
      {tiles.map((tile) => {
        const IconComponent = tile.Icon;
        const delay = `${Math.random() * 2}s`; // random 0–2 seconds delay
        return (
          <IconComponent
            key={tile.id}
            className="contact-us-icon"
            style={{
              top: `${tile.top + tile.jitterY}px`,
              left: `${tile.left + tile.jitterX}px`,
              position: "absolute",
              animationDelay: delay, // 👈 random delay ‼️‼️
            }}
          />
        );
      })}
    </div>
  );
};

export default ContactUsBackground;
