import React from "react";
import { useNavigate } from "react-router-dom";
import "./GameOverModal.css"; // We will add CSS below

const GameOverModal = ({ status, winnerUsername, reason }) => {
  const navigate = useNavigate();

  if (status === "active" || status === "waiting_for_opponent") return null;

  let title = "Game Over";
  let message = "";

  switch (status) {
    case "white_win":
      title = "White Wins!";
      message = "Checkmate or Resignation.";
      break;
    case "black_win":
      title = "Black Wins!";
      message = "Checkmate or Resignation.";
      break;
    case "draw":
      title = "Draw";
      message = "Stalemate, repetition, or insufficient material.";
      break;
    case "abandoned":
        title = "Abandoned";
        break;
    default:
      title = "Game Over";
  }

  if (reason === "timeout") message = "Time ran out!";

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="primary-button" onClick={() => navigate("/lobby")}>
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;