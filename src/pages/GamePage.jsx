import React, { useEffect } from "react";
// --- CHANGE 1: Import Link for the error state ---
import { Link, useParams } from "react-router-dom";
import ChessBoard from "../components/ChessBoard";
import { useAuth } from "../hooks/useAuth";
import { useGameSocket } from "../context/GameSocket";
import "./GamePage.css";

function GamePage() {
  console.log("[GamePage] Component rendering or re-rendering.");

  const { gameId } = useParams();
  const { user } = useAuth();

  const { gameData, isConnected, error, connect, disconnect, makeMove } =
    useGameSocket();

  // This useEffect hook is perfect as-is. It correctly handles connecting
  // when the component mounts (or gameId changes) and disconnecting on cleanup.
  useEffect(() => {
    if (gameId) {
      console.log("[GamePage] Effect: Connecting to game socket...");
      connect(gameId);
    }
    return () => {
      console.log("[GamePage] Cleanup: Disconnecting from game socket...");
      disconnect();
    };
  }, [gameId, connect, disconnect]);

  // --- CHANGE 2: Update 'handleMakeMove' to pass the gameId ---
  // Our new context function `makeMove(gameId, moveUci)` requires the gameId.
  const handleMakeMove = (move) => {
    console.log("[GamePage] handleMakeMove called with move:", move);
    const moveUci = `${move.from}${move.to}`;

    // Pass the gameId from useParams to the makeMove function.
    makeMove(gameId, moveUci);
  };

  // --- The Loading and Error States ---
  // This logic is mostly good, with a small fix for displaying the error.
  if (error) {
    return (
      <div className="game-page-container status-container">
        {/* Make sure to display the error message from the context */}
        <h2 className="error-text">Connection Error: {error}</h2>
        <p>Could not connect to the game server. Please try again later.</p>
        <Link to="/lobby" className="primary-button">
          Back to Lobby
        </Link>
      </div>
    );
  }

  if (!isConnected || !gameData) {
    return (
      <div className="game-page-container status-container">
        <h2>{isConnected ? "Waiting for game data..." : "Connecting..."}</h2>
        <p>Your game will appear here shortly.</p>
      </div>
    );
  }

  // --- CHANGE 3: Handle the 'waiting for opponent' state gracefully ---
  // The 'gameData' might exist before the black_player has joined.
  // We need to check for this to avoid errors.
  const isWaitingForOpponent = !gameData.black_player || !gameData.white_player;

  // Determine the player's color. This needs to be safe in case a player is null.
  const playerColor = user.user_id === gameData.black_player?.id ? "b" : "w";

  // Destructure the game data for easier use
  const { current_fen: fen, turn, status, moves } = gameData;

  // The props for the chessboard remain the same.
  const propsForBoard = {
    playerColor,
    initialFen: fen, // Pass the FEN from the gameData
    onMove: handleMakeMove,
    turn,
  };

  return (
    <div className="game-page-container">
      <div className="game-info-bar">
        <div className="player-info white">
          White: {gameData.white_player?.username || "Waiting..."}
        </div>
        <div className="game-status-info">
          <h1>Game ID: {gameId}</h1>
          {isWaitingForOpponent ? (
            <p className="game-status">Waiting for opponent to join...</p>
          ) : (
            <>
              <p>
                Status:{" "}
                <span className="game-status">{status.replace(/_/g, " ")}</span>
              </p>
              <p>
                Turn:{" "}
                <span className="game-turn">
                  {turn === "w" ? "White" : "Black"}
                </span>
              </p>
            </>
          )}
        </div>
        <div className="player-info black">
          Black: {gameData.black_player?.username || "Waiting..."}
        </div>
      </div>

      <ChessBoard {...propsForBoard} />

      <div className="move-history">
        <h2>Move History</h2>
        <ol>
          {/* Use optional chaining to prevent errors if moves array is not present */}
          {moves?.map((moveNotation, index) => (
            <li key={index}>
              {/* Logic to display move number correctly */}
              {index % 2 === 0 ? `${Math.floor(index / 2) + 1}. ` : ""}
              {moveNotation}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default GamePage;
