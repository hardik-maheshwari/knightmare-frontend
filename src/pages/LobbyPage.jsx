import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import "./LobbyPage.css";

const LobbyPage = () => {
  console.log("[LobbyPage] Component rendering.");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [joinGameId, setJoinGameId] = useState("");

  const navigate = useNavigate();

  const handleCreateGame = async () => {
    if (isLoading) {
      console.warn(
        "[LobbyPage] Create game blocked, a request is already in progress."
      );
      return;
    }

    console.log("[LobbyPage] handleCreateGame started.");
    setIsLoading(true);
    setError(null);
    try {
      console.log("[LobbyPage] Sending create game request to /api/games/.");
      const response = await apiClient.post("/api/games/", {});

      const { data: gameData } = response.data;

      const gameId = gameData.game_id;

      console.log(
        `[LobbyPage] Game created successfully. Game ID: ${gameId}. Navigating...`
      );

      navigate(`/game/${gameId}`);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
        console.error("Failed to create game:", err.response.data);
      } else {
        setError("An unexpected error occurred. Please try again.");
        console.error("Failed to create game:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGame = async () => {
    const trimmedId = joinGameId.trim();
    if (!trimmedId || isLoading) {
      console.warn(
        "[LobbyPage] Join game blocked. ID is empty or request in progress."
      );
      return;
    }
    console.log(`[LobbyPage] handleJoinGame started for ID: ${trimmedId}`);
    setIsLoading(true);
    setError(null);
    try {
      console.log(
        `[LobbyPage] Sending join game request to /api/games/${trimmedId}/join.`
      );
      await apiClient.post(`/api/games/${trimmedId}/join/`, {});

      console.log(
        `[LobbyPage] Successfully joined game ${trimmedId}. Navigating...`
      );
      navigate(`/game/${trimmedId}`);
    } catch (err) {
      console.error(
        `[LobbyPage] Failed to join game ${trimmedId}.`,
        err.response || err
      );
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      console.log("[LobbyPage] handleJoinGame finished.");
      setIsLoading(false);
    }
  };

  return (
    <div className="lobby-container">
      <h1>Game Lobby</h1>

      {error && <p className="lobby-error">{error}</p>}

      <div className="lobby-section">
        <h2>Start a New Game</h2>
        <p>Create a new game room and share the ID with a friend.</p>
        <button
          onClick={handleCreateGame}
          disabled={isLoading}
          className="primary-button"
        >
          {isLoading ? "Creating..." : "Create New Game"}
        </button>
      </div>

      <div className="lobby-section">
        <h2>Join an Existing Game</h2>
        <p>Enter the Game ID you received from a friend.</p>
        <div className="join-form">
          <input
            type="text"
            placeholder="Enter Game ID"
            value={joinGameId}
            onChange={(e) => setJoinGameId(e.target.value)}
            className="game-id-input"
            onKeyDown={(e) => e.key === "Enter" && handleJoinGame()} // Bonus: Allow pressing Enter
          />
          <button
            onClick={handleJoinGame}
            disabled={!joinGameId || isLoading}
            className="secondary-button"
          >
            {isLoading ? "Joining..." : "Join Game"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;
