import { useState, useEffect, useRef } from "react";
// We import the specific class, not the singleton functions anymore
import { Chess } from "chess.js";
import { parseFen } from "../utils/fenUtils";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

export const getIndexFromSquareId = (squareId) => {
  const file = squareId.charAt(0);
  const rank = squareId.charAt(1);
  const f = files.indexOf(file);
  const r = parseInt(rank) - 1;
  return (7 - r) * 8 + f;
};

export const useChessGame = (playerColor = "w", initialFen, onMove, turn) => {
  // 1. STATE: Visual board state
  const [boardState, setBoardState] = useState(() => parseFen(initialFen));

  // 2. REF: Keep a local instance of chess.js for this specific component
  // This prevents the "singleton" bugs.
  const gameRef = useRef(new Chess(initialFen));

  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);

  // 3. EFFECT: Sync engine when Server FEN changes
  useEffect(() => {
    try {
      // Safe guard: If FEN is invalid, Chess() might throw
      const newGame = new Chess(initialFen);
      gameRef.current = newGame;

      // Update visual state
      setBoardState(parseFen(initialFen));

      // Clear selections on external update (new turn)
      setSelectedSquare(null);
      setLegalMoves([]);
    } catch (e) {
      console.error("Invalid FEN received:", initialFen, e);
    }
  }, [initialFen]);

   const handleSquareClick = (clickedSquareId) => {
    const game = gameRef.current;

    // SCENARIO A: No piece currently selected
    if (selectedSquare === null) {
      const fromIndex = getIndexFromSquareId(clickedSquareId);
      const piece = boardState[fromIndex];

      const isMyTurn = turn === playerColor;
      const isMyPiece = piece && piece.charAt(0) === playerColor;

      if (!isMyPiece || !isMyTurn) {
        return;
      }

      const moves = game.moves({ square: clickedSquareId, verbose: true });
      const targetSquares = moves.map((m) => m.to);

      setSelectedSquare(clickedSquareId);
      setLegalMoves(targetSquares);
    }

    // SCENARIO B: Piece is already selected
    else {
      // 1. Did user click the SAME square? -> Deselect
      if (clickedSquareId === selectedSquare) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // 2. Did user click ANOTHER of their own pieces? -> Switch selection
      const clickedIndex = getIndexFromSquareId(clickedSquareId);
      const clickedPiece = boardState[clickedIndex];
      if (clickedPiece && clickedPiece.charAt(0) === playerColor) {
        const moves = game.moves({ square: clickedSquareId, verbose: true });
        const targetSquares = moves.map((m) => m.to);
        setSelectedSquare(clickedSquareId);
        setLegalMoves(targetSquares);
        return;
      }

      // 3. Is it a LEGAL move?
      if (legalMoves.includes(clickedSquareId)) {
        // CHANGE 1: Only look for moves generated from the 'selectedSquare'
        // This is faster than generating moves for the whole board.
        const moves = game.moves({ square: selectedSquare, verbose: true });
        
        const moveDetails = moves.find(
          (m) => m.to === clickedSquareId
        );

        // CHANGE 2: Robust check. If a move exists and has the 'promotion' field,
        // it means this move IS a promotion.
        const isPromotion = !!moveDetails?.promotion;

        const move = {
          from: selectedSquare,
          to: clickedSquareId,
          // Currently hardcoded to Queen ('q'). 
          // If you want to support underpromotion (Rook/Knight), 
          // you would need to open a Modal UI here instead of firing onMove immediately.
          promotion: isPromotion ? "q" : undefined,
        };

        if (onMove) onMove(move);

        setSelectedSquare(null);
        setLegalMoves([]);
      } else {
        // 4. Illegal move clicked
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    }
  };

  return {
    boardState,
    selectedSquare,
    handleSquareClick,
    legalMoves,
  };
};
