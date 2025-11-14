import React, { useState } from "react";
import TetrominoIcon from "./TetrominoIcon";

const PIECES = ["I","O","T","S","Z","J","L"];

export default function PiecePicker({ value = "T", onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 hover:bg-gray-50"
        aria-haspopup="listbox"
        aria-expanded={open}
        title={`Piece: ${value}`}
      >
        <TetrominoIcon piece={value} size={20} />
        <span className="text-sm text-gray-900">{value}</span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-[9999] mt-1 grid grid-cols-[repeat(7,32px)] gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
        >
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
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-none bg-transparent hover:bg-gray-100"
              title={p}
            >
              <TetrominoIcon piece={p} size={20} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
