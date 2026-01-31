import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useRef,
  useEffect, // Added useEffect for global cleanup
} from "react";
import { useAuth } from "../hooks/useAuth";
import apiClient from "../services/apiClient";

const GameSocketContext = createContext(null);

export function GameSocketProvider({ children }) {
  const { token } = useAuth();

  const [gameData, setGameData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  // Refs to track connection state without triggering re-renders
  const socketRef = useRef(null);
  const isConnectingRef = useRef(false);
  const mountedRef = useRef(true); // Track if component is mounted

  // Track mount status to prevent setting state on unmounted component
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Safety cleanup on unmount
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const connect = useCallback(
    async (gameId) => {
      // 1. Guard clauses
      if (!token) {
        setError("Authentication token is missing.");
        return;
      }

      // Prevent double-initiation (React StrictMode fix)
      if (isConnectingRef.current || socketRef.current) {
        console.log("[GameSocket] Connection already in progress or active.");
        return;
      }

      console.log(
        `[GameSocket] Starting connection process for game: ${gameId}`,
      );
      isConnectingRef.current = true;
      setError(null);

      try {
        // 2. Get Ticket
        const response = await apiClient.post(
          `/api/games/${gameId}/ws-ticket/`,
        );

        // If unmounted while waiting for ticket, stop here.
        if (!mountedRef.current) return;

        const ticket = response.data.data.ticket;
        if (!ticket) throw new Error("No ticket received from server.");

        // 3. Construct URL (Handle SSL automatically)
        // If frontend is https://, use wss://. If http://, use ws://
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host; // e.g. localhost:5173

        // Note: This relies on Vite Proxy forwarding /api/games/... to your backend
        const url = `${protocol}//${host}/api/games/${gameId}/ws?ticket=${ticket}`;

        console.log(`[GameSocket] Connecting to: ${url}`);
        const newSocket = new WebSocket(url);

        // 4. Bind Events
        newSocket.onopen = () => {
          if (!mountedRef.current) {
            newSocket.close();
            return;
          }
          console.log("[GameSocket] Connection established.");
          setIsConnected(true);
          setError(null);
          isConnectingRef.current = false; // Connection phase done
        };

        newSocket.onmessage = (event) => {
          if (!mountedRef.current) return;
          try {
            const message = JSON.parse(event.data);

            if (message.type === "game_update") {
              setGameData((prevData) => {
                const newData = message.data;

                // 1. First Load: If no previous data exists, trust the server entirely.
                // (The initial connection/join always sends the full history).
                if (!prevData) {
                  return newData;
                }

                // 2. Incremental Update Logic
                // The server sends `moves: []` to save bandwidth on active moves.
                // We need to check if we should overwrite or append.
                let mergedMoves = [];

                if (newData.moves && newData.moves.length > 0) {
                  // Case A: Server sent the full list (e.g. Reconnect/Join). Use it.
                  mergedMoves = newData.moves;
                } else {
                  // Case B: Server sent empty list. Use our OLD list + the NEW move.
                  const oldMoves = prevData.moves || [];
                  mergedMoves = [...oldMoves];

                  // Only append if there is a 'last_move' and it's not already the last one (dedupe)
                  if (
                    newData.last_move &&
                    oldMoves[oldMoves.length - 1] !== newData.last_move
                  ) {
                    mergedMoves.push(newData.last_move);
                  }
                }

                return {
                  ...newData, // Take the new FEN, Turn, Status, etc.
                  moves: mergedMoves, // Use our smart, merged history list
                };
              });
            }

            // Handle other message types if needed (e.g. "takeback_offered")
          } catch (e) {
            console.error("Error parsing WS message", e);
          }
        };

        newSocket.onclose = (event) => {
          if (!mountedRef.current) return;
          console.log(`[GameSocket] Closed: ${event.code}`);
          setIsConnected(false);
          socketRef.current = null;
          isConnectingRef.current = false;

          if (!event.wasClean) {
            setError("Connection lost. Please refresh.");
          }
        };

        newSocket.onerror = (err) => {
          console.error("[GameSocket] Error:", err);
          // Let onclose handle the state cleanup
        };

        socketRef.current = newSocket;
      } catch (err) {
        console.error("[GameSocket] Connection failed:", err);
        if (mountedRef.current) {
          setError(err.response?.data?.error || "Failed to connect.");
          setIsConnected(false);
        }
        isConnectingRef.current = false;
      }
    },
    [token],
  );

  const disconnect = useCallback(() => {
    // We intentionally don't set isConnected(false) here immediately
    // to prevent UI flicker if it's just a remount.
    // The 'onclose' event will handle the state update.

    if (socketRef.current) {
      console.log("[GameSocket] Disconnecting manual trigger...");
      socketRef.current.close();
      socketRef.current = null;
    }
    isConnectingRef.current = false;
  }, []);

  const makeMove = useCallback(async (gameId, moveUci) => {
    try {
      await apiClient.post(`/api/games/${gameId}/moves/`, { move: moveUci });
      return true;
    } catch (error) {
      console.error("[GameSocket] Failed to send move:", error);
      alert(`Move failed: ${error.response?.data?.error || "Unknown error"}`);
      return false;
    }
  }, []);

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
  return useContext(GameSocketContext);
}
