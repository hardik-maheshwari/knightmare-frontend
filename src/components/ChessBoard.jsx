import React from "react";
import ChessPiece from "./ChessPiece";
import "./ChessBoard.css";
import { useChessGame } from "../hooks/useChessGame";

const Chessboard = ({ playerColor, initialFen, onMove,turn }) => {
  const { boardState, selectedSquare, handleSquareClick, legalMoves } =
    useChessGame(playerColor, initialFen, onMove,turn);

  const ranks = ["1", "2", "3", "4", "5", "6", "7", "8"];
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

  const isFlipped = playerColor === "b";

  // 2. We create arrays that are in the correct VISUAL order for rendering.
  //    If the board is flipped, we reverse them.
  const visualRanks = isFlipped ? [...ranks] : [...ranks].reverse();
  const visualFiles = isFlipped ? [...files].reverse() : files;

  // --- END OF FLIP LOGIC ---

  const squares = [];
  // 3. The loops now iterate over the pre-ordered visual arrays.
  for (const rank of visualRanks) {
    for (const file of visualFiles) {
      const squareId = `${file}${rank}`;
      const isLegalMove = legalMoves.includes(squareId);

      const r = parseInt(rank) - 1;
      const f = files.indexOf(file);
      const isLightSquare = (r + f) % 2 !== 0;

      // This temporary helper is still needed.
      const getIndex = (sid) => {
        const fileChar = sid.charAt(0);
        const rankChar = sid.charAt(1);
        const fileIndex = files.indexOf(fileChar);
        const rankIndex = parseInt(rankChar) - 1;
        return (7 - rankIndex) * 8 + fileIndex;
      };

      const piece = boardState[getIndex(squareId)];
      const isSelected = squareId === selectedSquare;

      const squareClassName = `square ${isLightSquare ? "light" : "dark"} ${
        isSelected ? "selected" : ""
      } ${isLegalMove ? "legal-move-hint" : ""}`;

      squares.push(
        <div
          key={squareId}
          className={squareClassName}
          onClick={() => handleSquareClick(squareId)}
        >
          {piece && <ChessPiece piece={piece} />}
        </div>
      );
    }
  }

  // The final return statement also uses the visual arrays for the labels.
  return (
    <div className="board-layout">
      <div className="rank-labels">
        {/* 4. We use visualRanks here so the labels flip with the board. */}
        {visualRanks.map((rank) => (
          <span key={rank}>{rank}</span>
        ))}
      </div>

      <div className="file-labels">
        {/* 5. Same for visualFiles. */}
        {visualFiles.map((file) => (
          <span key={file}>{file}</span>
        ))}
      </div>

      <div className="chessboard">{squares}</div>
    </div>
  );
};

export default Chessboard;
