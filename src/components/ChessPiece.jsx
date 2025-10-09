// The final, correct code for ChessPiece.jsx
import React from "react";
import "./ChessPiece.css";

const pieceImages = {
  wP: "wP.svg",
  wR: "wR.svg",
  wN: "wN.svg",
  wB: "wB.svg",
  wQ: "wQ.svg",
  wK: "wK.svg",
  bP: "bP.svg",
  bR: "bR.svg",
  bN: "bN.svg",
  bB: "bB.svg",
  bQ: "bQ.svg",
  bK: "bK.svg",
};

const ChessPiece = ({ piece }) => {
  if (!piece) return null;

  const imageUrl = new URL(
    `../assets/pieces/${pieceImages[piece]}`,
    import.meta.url
  ).href;

  return (
    <div
      className="chess-piece"
      style={{ backgroundImage: `url(${imageUrl})` }}
    ></div>
  );
};

export default ChessPiece;
