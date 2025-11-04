import React, { useState } from "react";
import TetrominoIcon from "./TetrominoIcon";

const PIECES = ["I","O","T","S","Z","J","L"];

export default function PiecePicker({ value = "T", onChange }) {
  const [open, setOpen] = useState(false);

  const btnStyle = {
    border: "1px solid #D1D5DB",
    borderRadius: 6,
    padding: "6px 10px",
    background: "#fff",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
  };

  const menuStyle = {
    position: "absolute",
    zIndex: 9999,
    marginTop: 4,
    background: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    boxShadow:
      "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
    padding: 8,
    display: "grid",
    gridTemplateColumns: "repeat(7, 32px)",
    gap: 8,
  };

  const itemStyle = {
    width: 32,
    height: 32,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    background: "transparent",
    border: "none",
    cursor: "pointer",
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={btnStyle}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={`Piece: ${value}`}
      >
        <TetrominoIcon piece={value} size={20} />
        <span style={{ fontSize: 14, color: "#111827" }}>{value}</span>
      </button>

      {open && (
        <div role="listbox" style={menuStyle}>
          {PIECES.map((p) => (
            <button
              key={p}
              type="button"
              role="option"
              aria-selected={p === value}
              onClick={() => {
                onChange?.(p);
                setOpen(false);
              }}
              style={itemStyle}
              title={p}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <TetrominoIcon piece={p} size={20} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
