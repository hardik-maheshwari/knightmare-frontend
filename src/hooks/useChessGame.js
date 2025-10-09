// src/hooks/useChessGame.js

import { useState,useEffect } from "react";
const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
import {
  initializeGame,
  // makeMove,
  // getCurrentFen,
  getLegalMoves,
} from "../services/chessEngine";

import { parseFen } from "../utils/fenUtils";

export const getIndexFromSquareId = (squareId) => {
  const file = squareId.charAt(0);
  const rank = squareId.charAt(1);
  const f = files.indexOf(file);
  const r = parseInt(rank) - 1;
  return (7 - r) * 8 + f;
};

export const useChessGame = (playerColor = "w", initialFen, onMove, turn) => {
  console.log(`This is our initial fen ${initialFen}`);
  console.log("*".repeat(100));
  const [boardState, setBoardState] = useState(() => parseFen(initialFen));

  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);

  useEffect(() => {
    console.log(
      "[useChessGame] useEffect running to sync engine with new FEN."
    );

    // The side effect:
    initializeGame(initialFen);

    // We also need to update our local boardState to match the new FEN.
    setBoardState(parseFen(initialFen));
  }, [initialFen]);

  const handleSquareClick = (clickedSquareId) => {
    console.log(
      `[useChessGame] handleSquareClick called for square: ${clickedSquareId}`
    );

    if (selectedSquare === null) {
      // --- This is the block we are improving ---
      const fromIndex = getIndexFromSquareId(clickedSquareId);
      const piece = boardState[fromIndex];

      // 2. We add our new validation logic here.
      const isMyTurn = turn === playerColor;
      const isMyPiece = piece && piece.charAt(0) === playerColor;

      if (!isMyPiece || !isMyTurn) {
        console.warn("[useChessGame] Piece selection blocked.", {
          isMyPiece,
          isMyTurn,
        });
        return; // Exit the function if it's not our piece or not our turn.
      }

      console.log(
        `[useChessGame] Selecting piece ${piece} at ${clickedSquareId}.`
      );
      setSelectedSquare(clickedSquareId);
      setLegalMoves(getLegalMoves(clickedSquareId));
    } else {
      // --- This block is now correct because of our previous refactor ---
      console.log(
        `[useChessGame] Attempting to move from ${selectedSquare} to ${clickedSquareId}.`
      );
      const move = {
        from: selectedSquare,
        to: clickedSquareId,
      };

      if (onMove) {
        console.log("[useChessGame] Calling onMove callback.");
        onMove(move);
      } else {
        console.warn(
          "[useChessGame] Move attempted, but no onMove callback was provided."
        );
      }

      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  return {
    boardState,
    selectedSquare,
    handleSquareClick,
    legalMoves,
  };
};
