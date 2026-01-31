import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import ChessBoard from "../components/ChessBoard";
import { useAuth } from "../hooks/useAuth";
import { useGameSocket } from "../context/GameSocket";
import "./GamePage.css";

function GamePage() {
  const { gameId } = useParams();
  const { user } = useAuth();
  const { gameData, isConnected, error, connect, disconnect, makeMove } = useGameSocket();

  useEffect(() => {
    if (gameId) {
      connect(gameId);
    }
    return () => {
      disconnect();
    };
  }, [gameId, connect, disconnect]);

  // --- AUTO-QUEEN LOGIC HERE ---
  const handleMakeMove = (move) => {
    // 1. Check if the move object ALREADY has a promotion flag (from useChessGame)
    // 2. Or if we need to infer it (Manual string check for pawn reaching last rank)
    //    (e.g., White pawn on rank 7 going to rank 8)
    
    let promotionChar = move.promotion || "";
    
    // Fallback: If useChessGame didn't tag it, but it's a pawn move to the end:
    if (!promotionChar) {
       // Ideally useChessGame handles this, but as a safety net:
       // This simple check assumes 'move' has {from, to}
       // We can just append 'q' if the backend requires it for ALL promotions.
       // However, relies on the hook sending the correct flag.
    }

    const moveUci = `${move.from}${move.to}${promotionChar}`;
    console.log(`[GamePage] Submitting Move: ${moveUci}`);
    makeMove(gameId, moveUci);
  };

  if (error) {
    return (
      <div className="game-page-container status-container">
        <h2 className="error-text">Connection Error: {error}</h2>
        <Link to="/lobby" className="primary-button">Back to Lobby</Link>
      </div>
    );
  }

  if (!isConnected || !gameData) {
    return (
      <div className="game-page-container status-container">
        <h2>{isConnected ? "Waiting for game data..." : "Connecting..."}</h2>
      </div>
    );
  }

  const isWaitingForOpponent = !gameData.black_player || !gameData.white_player;
  const playerColor = user.user_id === gameData.black_player?.id ? "b" : "w";
  const { current_fen: fen, turn, status, moves } = gameData;

  const propsForBoard = {
    playerColor,
    initialFen: fen,
    onMove: handleMakeMove,
    turn,
  };

  // --- HISTORY PROCESSOR ---
  // Convert flat array ["e4", "e5", "Nf3"] into pairs [["e4", "e5"], ["Nf3", null]]
  const movePairs = [];
  if (moves && Array.isArray(moves)) {
    for (let i = 0; i < moves.length; i += 2) {
      movePairs.push([moves[i], moves[i + 1] || ""]);
    }
  }

  return (
    <div className="game-page-container">
      <div className="game-info-bar">
        <div className="player-info white">White: {gameData.white_player?.username || "..."}</div>
        <div className="game-status-info">
          <h1>Game ID: {gameId}</h1>
          <p>Status: <span className="game-status">{status?.replace(/_/g, " ")}</span></p>
          <p>Turn: <span className="game-turn">{turn === "w" ? "White" : "Black"}</span></p>
        </div>
        <div className="player-info black">Black: {gameData.black_player?.username || "..."}</div>
      </div>

      <ChessBoard {...propsForBoard} />

      {/* --- FIXED HISTORY SECTION --- */}
      <div className="move-history" style={{ 
          color: "#fff", 
          backgroundColor: "#333", 
          padding: "1rem", 
          borderRadius: "8px",
          marginTop: "1rem",
          minHeight: "100px"
      }}>
        <h3 style={{ marginTop: 0, textAlign: "center", borderBottom: "1px solid #555" }}>Move History</h3>
        
        {movePairs.length === 0 ? (
          <p style={{ textAlign: "center", color: "#aaa" }}>No moves yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "#aaa", fontSize: "0.9rem" }}>
                <th style={{ textAlign: "left" }}>#</th>
                <th style={{ textAlign: "left" }}>White</th>
                <th style={{ textAlign: "left" }}>Black</th>
              </tr>
            </thead>
            <tbody>
              {movePairs.map((pair, index) => (
                <tr key={index} style={{ borderBottom: "1px solid #444" }}>
                  <td style={{ color: "#888", width: "30px" }}>{index + 1}.</td>
                  <td style={{ padding: "4px" }}>{pair[0]}</td>
                  <td style={{ padding: "4px" }}>{pair[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default GamePage;