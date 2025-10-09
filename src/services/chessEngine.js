import { Chess } from "chess.js";

// Create the single, persistent game instance.
// It automatically starts with the standard starting position.
let game = new Chess();

/**
 * Makes a move on the board.
 * @param {object} move - The move to make, e.g., { from: 'e2', to: 'e4' }
 * @returns {object|null} - The move object if the move was legal, otherwise null.
 */
export const makeMove = (move) => {
  try {
    // The `move` method in chess.js is the core of its validation.
    // It will return null if the move is not legal according to the rules.
    const result = game.move(move);
    return result;
  } catch (e) {
    // This catches cases where the move object itself is malformed.
    console.error("Invalid move format:", move, e);
    return null;
  }
};

/**
 * Gets the current board state as a FEN string.
 * @returns {string} - The FEN representation of the current position.
 */
export const getCurrentFen = () => {
  return game.fen();
};

/**
 * Gets whose turn it is.
 * @returns {'w' | 'b'} - 'w' for white, 'b' for black.
 */
export const getTurn = () => {
  return game.turn();
};

// We can add more functions later, like:
// Add this new function to src/services/chessEngine.js

/**
 * Gets a list of legal destination squares for a piece on a given square.
 * @param {string} square - The square to check, e.g., 'e2'.
 * @returns {string[]} - An array of legal destination squares, e.g., ['e3', 'e4'].
 */
export const getLegalMoves = (square) => {
  // We use the `verbose: true` option to get detailed move objects.
  const moves = game.moves({ square: square, verbose: true });

  // We then extract just the "to" square from each move object.
  return moves.map((move) => move.to);
};

// export const isCheckmate = () => game.isCheckmate();

export const initializeGame = (fen) => {
  game = fen ? new Chess(fen) : new Chess();
};
