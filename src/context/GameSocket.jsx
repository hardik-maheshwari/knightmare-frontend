import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "../hooks/useAuth";
// --- CHANGE 1: Import your apiClient ---
import apiClient from "../services/apiClient";

const GameSocketContext = createContext(null);

export function GameSocketProvider({ children }) {
  // Your 'useAuth' hook is perfect, no changes needed here.
  const { token } = useAuth();

  const [gameData, setGameData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  // --- CHANGE 2: The 'connect' function is now async and uses the ticket system ---
  const connect = useCallback(
    async (gameId) => {
      console.log(
        `[GameSocketContext] Starting connection process for game: ${gameId}`
      );

      // The guard clauses are still very important.
      if (!token) {
        console.error("[GameSocket] Cannot connect without an auth token.");
        setError("Authentication token is missing.");
        return;
      }
      if (socketRef.current) {
        console.log("[GameSocket] A connection is already active.");
        return;
      }

      try {
        // Step 1: Make a secure HTTP call to get a temporary ticket.
        console.log(
          `[GameSocket] Requesting WebSocket ticket for game: ${gameId}`
        );
        const response = await apiClient.post(
          `/api/games/${gameId}/ws-ticket/`
        );
        const ticket = response.data.data.ticket;

        if (!ticket) {
          throw new Error(
            "Failed to retrieve a WebSocket ticket from the server."
          );
        }

        // Step 2: Use the ticket to build the WebSocket URL.
        // The URL is relative because our Vite proxy will handle forwarding it.
        const url = `ws://${window.location.host}/api/games/${gameId}/ws?ticket=${ticket}`;
        console.log(`[GameSocket] Connecting to WebSocket at: ${url}`);

        const newSocket = new WebSocket(url);

        // Your event listener setup is perfect and doesn't need to change.
        newSocket.addEventListener("open", () => {
          console.log("[GameSocket] Connection established.");
          setIsConnected(true);
          setError(null);
        });

        newSocket.addEventListener("message", (event) => {
          const message = JSON.parse(event.data);
          console.debug("[GameSocket] Received message:", message);

          if (message.type === "game_update") {
            setGameData(message.data);
          } else {
            console.warn(
              "[GameSocket] Received unhandled message type:",
              message.type
            );
          }
        });

        newSocket.addEventListener("close", (event) => {
          console.log(
            `[GameSocket] Connection closed. Code: ${event.code}, Reason: ${event.reason}`
          );
          setIsConnected(false);
          socketRef.current = null;
          // If the closure was unexpected, set an error message.
          if (!event.wasClean) {
            setError("Connection to the game server was lost.");
          }
        });

        newSocket.addEventListener("error", (err) => {
          console.error("[GameSocket] WebSocket error:", err);
          setError("A connection error occurred.");
        });

        socketRef.current = newSocket;
      } catch (err) {
        // This catch block now handles errors from both the HTTP ticket request and WebSocket connection.
        console.error(
          "[GameSocket] Failed to establish connection:",
          err.response?.data?.error || err.message
        );
        setError(err.response?.data?.error || "Failed to connect to the game.");
      }
    },
    [token] // The 'connect' function depends on the auth token.
  );

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log("[GameSocket] Disconnecting...");
      socketRef.current.close(1000, "User disconnected"); // Send a clean close code
    }
  }, []);

  // --- CHANGE 3: 'makeMove' now sends an HTTP POST command, not a WebSocket message ---
  const makeMove = useCallback(
    async (gameId, moveUci) => {
      // It's a command, so it doesn't need the socket to be open, just an auth token.
      console.log(
        `[GameSocket] Sending move command: ${moveUci} for game ${gameId}`
      );
      try {
        // The client's job is just to send the command.
        // The server is responsible for broadcasting the state change.
        // We don't even need to process the response here.
        await apiClient.post(`/api/games/${gameId}/moves/`, { move: moveUci });
        // The 'await' ensures we don't proceed until the server acknowledges the move.
        return true; // Indicate success to the caller
      } catch (error) {
        console.error(
          "[GameSocket] Failed to send move:",
          error.response?.data?.error || error.message
        );
        // We can pass the server's error message back to the UI.
        alert(
          `Error making move: ${
            error.response?.data?.error || "An unknown error occurred."
          }`
        );
        return false; // Indicate failure
      }
    },
    [] // This function doesn't depend on any props or state from this context.
  );

  const value = {
    gameData,
    isConnected,
    error,
    connect,
    disconnect,
    makeMove,
  };

  return (
    <GameSocketContext.Provider value={value}>
      {children}
    </GameSocketContext.Provider>
  );
}

export function useGameSocket() {
  const context = useContext(GameSocketContext);
  if (context === null) {
    throw new Error("useGameSocket must be used within a GameSocketProvider");
  }
  return context;
}
