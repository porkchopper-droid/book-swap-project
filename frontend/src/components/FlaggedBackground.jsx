import { useState, useEffect, useRef } from "react";
import PackageBoxOne from "../icons/basic-denied-outline-svgrepo-com.svg?react";
import "./FlaggedBackground.scss";

const ICON_SIZE = 150; // px

const FlaggedBackground = () => {
  const [tiles, setTiles] = useState([]);
  const gridRef = useRef(null);

  const updateTiles = () => {
    const gridContainer = gridRef.current?.parentElement;
    if (!gridContainer) return;

    const { width, height } = gridContainer.getBoundingClientRect();
    const cols = Math.ceil(width / ICON_SIZE) + 1;
    const rows = Math.ceil(height / ICON_SIZE) + 1;

    const newTiles = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const jitterX = Math.floor(Math.random() * 20) - 10; // -10 to +10 px
        const jitterY = Math.floor(Math.random() * 20) - 10;
        const delay = `${Math.random() * 2}s`; // random 0–2s delay

        newTiles.push({
          id: `${row}-${col}`,
          top: row * ICON_SIZE,
          left: col * ICON_SIZE,
          jitterX,
          jitterY,
          delay,
        });
      }
    }

    setTiles(newTiles);
  };

  useEffect(() => {
    updateTiles();

    const observer = new ResizeObserver(() => {
      updateTiles();
    });

    if (gridRef.current?.parentElement) {
      observer.observe(gridRef.current.parentElement);
    }

    window.addEventListener("resize", updateTiles);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateTiles);
    };
  }, []);

  return (
    <div ref={gridRef} className="flagged-grid animated">
      {tiles.map((tile) => (
        <PackageBoxOne
          key={tile.id}
          className="flagged-icon"
          style={{
            top: `${tile.top + tile.jitterY}px`,
            left: `${tile.left + tile.jitterX}px`,
            position: "absolute",
            animationDelay: tile.delay,
          }}
        />
      ))}
    </div>
  );
};

export default FlaggedBackground;
