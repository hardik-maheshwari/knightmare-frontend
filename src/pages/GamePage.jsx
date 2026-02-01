import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import ChessBoard from "../components/ChessBoard";
import { useAuth } from "../hooks/useAuth";
import { useGameSocket } from "../context/GameSocket";
import VideoChat from "../components/VideoChat";
import ChatPanel from "../components/ChatPanel";
import "./GamePage.css";

function GamePage() {
  const { gameId } = useParams();
  const { user } = useAuth();

  // We now destructure 'latestSignal' to pass it to the VideoChat
  const {
    gameData,
    isConnected,
    error,
    connect,
    disconnect,
    makeMove,
    latestSignal,
  } = useGameSocket();

  // 1. Connection Lifecycle
  useEffect(() => {
    if (gameId) {
      connect(gameId);
    }
    return () => {
      disconnect();
    };
  }, [gameId, connect, disconnect]);

  // 2. Handle Moves (Auto-Queen Logic)
  const handleMakeMove = (move) => {
    // The 'promotion' field comes from our updated useChessGame hook.
    // If it's a promotion move, it will be 'q'.
    const promotionChar = move.promotion || "";
    const moveUci = `${move.from}${move.to}${promotionChar}`;

    console.log(`[GamePage] Submitting Move: ${moveUci}`);
    makeMove(gameId, moveUci);
  };

  // 3. Loading / Error States
  if (error) {
    return (
      <div
        className="game-layout-grid"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="status-container">
          <h2 className="error-text">Connection Error</h2>
          <p>{error}</p>
          <Link to="/lobby" className="primary-button">
            Back to Lobby
          </Link>
        </div>
      </div>
    );
  }

  if (!isConnected || !gameData) {
    return (
      <div
        className="game-layout-grid"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h2>Connecting to Game...</h2>
      </div>
    );
  }

  // 4. Prepare Game Data
  const isWaitingForOpponent = !gameData.black_player || !gameData.white_player;
  const playerColor = user.user_id === gameData.black_player?.id ? "b" : "w";
  const { current_fen: fen, turn, status, moves } = gameData;

  const propsForBoard = {
    playerColor,
    initialFen: fen,
    onMove: handleMakeMove,
    turn,
  };

  // Helper: Group moves into pairs for the table: ["e4", "e5"] -> [["e4", "e5"], ...]
  const movePairs = [];
  if (moves && Array.isArray(moves)) {
    for (let i = 0; i < moves.length; i += 2) {
      movePairs.push([moves[i], moves[i + 1] || ""]);
    }
  }

  // 5. Render The Grid Layout
  return (
    <div className="game-layout-grid">
      {/* --- LEFT COLUMN: History & Info --- */}
      <div className="sidebar-left">
        {/* Game Status Panel */}
        <div
          className="move-history-panel"
          style={{ flexGrow: 0, minHeight: "auto", marginBottom: "10px" }}
        >
          <h3 style={{ marginTop: 0, borderBottom: "1px solid #444" }}>
            Game Info
          </h3>
          <div style={{ fontSize: "0.9rem", color: "#ccc" }}>
            <p style={{ margin: "5px 0" }}>
              <strong>ID:</strong> {gameId}
            </p>
            <p style={{ margin: "5px 0" }}>
              <strong>Status:</strong>{" "}
              <span style={{ color: "#a0c4ff", textTransform: "capitalize" }}>
                {status?.replace(/_/g, " ")}
              </span>
            </p>
          </div>
        </div>

        {/* Move History Panel */}
        <div className="move-history-panel">
          <h3 style={{ marginTop: 0, borderBottom: "1px solid #444" }}>
            Moves
          </h3>
          <div className="history-scroll-area">
            <table className="history-table">
              <thead>
                <tr style={{ color: "#888", textAlign: "left" }}>
                  <th>#</th>
                  <th>White</th>
                  <th>Black</th>
                </tr>
              </thead>
              <tbody>
                {movePairs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="3"
                      style={{
                        textAlign: "center",
                        color: "#666",
                        padding: "20px",
                      }}
                    >
                      Start the game!
                    </td>
                  </tr>
                ) : (
                  movePairs.map((pair, index) => (
                    <tr
                      key={index}
                      style={{
                        backgroundColor:
                          index % 2 === 0
                            ? "transparent"
                            : "rgba(255,255,255,0.05)",
                      }}
                    >
                      <td className="move-num">{index + 1}.</td>
                      <td>{pair[0]}</td>
                      <td>{pair[1]}</td>
                    </tr>
                  ))
                )}
                {/* Auto-scroll anchor could go here */}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- CENTER COLUMN: Chess Board --- */}
      <div className="main-board-area">
        <div className="opponent-label">
          {/* Logic to show Opponent Name */}
          {playerColor === "w"
            ? gameData.black_player?.username || "Waiting for Black..."
            : gameData.white_player?.username || "Waiting for White..."}
        </div>

        <ChessBoard {...propsForBoard} />

        <div className="self-label">
          {user.username} ({playerColor === "w" ? "White" : "Black"})
        </div>
      </div>

      {/* --- RIGHT COLUMN: Video & Chat --- */}
      <div className="sidebar-right">
        {/* Pass the signal data to VideoChat so it knows who to call */}
        <VideoChat
          gameId={gameId}
          userId={user.user_id}
          incomingSignal={latestSignal}
        />

        {/* --- UPDATED SECTION --- */}
        {/* We use a flex container to let ChatPanel take remaining height */}
        <div style={{ flex: 1, minHeight: 0, marginTop: "10px" }}>
          <ChatPanel gameId={gameId} />
        </div>
        {/* ----------------------- */}
      </div>
    </div>
  );
}

export default GamePage;
