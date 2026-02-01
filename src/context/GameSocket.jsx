import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useAuth } from "../hooks/useAuth";
import apiClient from "../services/apiClient";

const GameSocketContext = createContext(null);

export function GameSocketProvider({ children }) {
  const { token } = useAuth();

  // --- STATE ---
  const [gameData, setGameData] = useState(null);
  const [chatMessages, setChatMessages] = useState([]); // <--- NEW: Chat State
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [latestSignal, setLatestSignal] = useState(null);

  // --- REFS ---
  const socketRef = useRef(null);
  const isConnectingRef = useRef(false);
  const mountedRef = useRef(true);
  const reconnectTimeoutRef = useRef(null); // <--- NEW: Reconnect Ref

  // --- CLEANUP ---
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Clear any pending reconnects
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
      // Close socket
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const connect = useCallback(
    async (gameId) => {
      if (!token) {
        setError("Authentication token is missing.");
        return;
      }
      // Prevent double-initiation
      if (
        isConnectingRef.current ||
        socketRef.current?.readyState === WebSocket.OPEN
      ) {
        return;
      }

      // Clear any pending retry timer if we are starting a fresh connection
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);

      console.log(`[GameSocket] Connecting to game: ${gameId}`);
      isConnectingRef.current = true;
      setError(null);

      try {
        // 1. Get Ticket
        const response = await apiClient.post(
          `/api/games/${gameId}/ws-ticket/`,
        );
        if (!mountedRef.current) return;

        const ticket = response.data.data.ticket;
        if (!ticket) throw new Error("No ticket received.");

        // 2. Connect WS
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        let wsUrl;

        if (backendUrl) {
          // Production / configured environment
          // Create a URL object to easily parse protocol and host
          const urlObj = new URL(backendUrl);
          const wsProtocol = urlObj.protocol === "https:" ? "wss:" : "ws:";
          wsUrl = `${wsProtocol}//${urlObj.host}/api/games/${gameId}/ws?ticket=${ticket}`;
        } else {
          // Fallback for local dev if env var is missing (uses same host)
          const protocol =
            window.location.protocol === "https:" ? "wss:" : "ws:";
          const host = window.location.host;
          wsUrl = `${protocol}//${host}/api/games/${gameId}/ws?ticket=${ticket}`;
        }

        const newSocket = new WebSocket(wsUrl);

        newSocket.onopen = () => {
          if (!mountedRef.current) return newSocket.close();
          console.log("[GameSocket] Connected.");
          setIsConnected(true);
          setError(null);
          isConnectingRef.current = false;
        };

        newSocket.onmessage = (event) => {
          if (!mountedRef.current) return;
          try {
            const message = JSON.parse(event.data);

            if (message.type === "game_update") {
              const newData = message.data;

              // A. Handle Chat History (if provided)
              if (newData.chat_history) {
                setChatMessages(newData.chat_history);
              }

              // B. Handle Game State
              setGameData((prevData) => {
                if (!prevData) return newData;
                // Merge Moves intelligently
                let mergedMoves = [];
                if (newData.moves && newData.moves.length > 0) {
                  mergedMoves = newData.moves;
                } else {
                  const oldMoves = prevData.moves || [];
                  mergedMoves = [...oldMoves];
                  if (
                    newData.last_move &&
                    oldMoves[oldMoves.length - 1] !== newData.last_move
                  ) {
                    mergedMoves.push(newData.last_move);
                  }
                }
                return { ...newData, moves: mergedMoves };
              });
            } else if (message.type === "signal_update") {
              setLatestSignal(message.data);
            } else if (message.type === "chat_message") {
              // C. Handle Real-time Chat
              setChatMessages((prev) => [...prev, message.data]);
            }
          } catch (e) {
            console.error("Error parsing WS message", e);
          }
        };

        newSocket.onclose = (event) => {
          if (!mountedRef.current) return;
          console.log(
            `[GameSocket] Closed: ${event.code} Clean: ${event.wasClean}`,
          );

          setIsConnected(false);
          socketRef.current = null;
          isConnectingRef.current = false;

          // --- RECONNECTION LOGIC ---
          // Code 1000 = Normal Closure, 1008 = Policy Violation (don't retry 1008)
          const isAbnormalClose =
            !event.wasClean && event.code !== 1000 && event.code !== 1008;

          if (isAbnormalClose) {
            console.warn("Connection lost unexpectedly. Retrying in 3s...");
            // Only show "Reconnecting" if we were previously connected to avoid flash on load
            setError("Reconnecting...");

            reconnectTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current) connect(gameId);
            }, 3000);
          } else if (!event.wasClean) {
            setError("Connection lost. Please refresh.");
          }
        };

        socketRef.current = newSocket;
      } catch (err) {
        console.error("[GameSocket] Connection failed:", err);
        if (mountedRef.current) {
          setError("Failed to connect.");
          setIsConnected(false);
        }
        isConnectingRef.current = false;
      }
    },
    [token],
  );

  const disconnect = useCallback(() => {
    if (socketRef.current) {
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
      console.error("Failed to send move", error);
      return false;
    }
  }, []);

  // --- NEW: Chat Function ---
  const sendChatMessage = useCallback(async (gameId, content) => {
    try {
      await apiClient.post(`/api/games/${gameId}/chat/`, { content });
    } catch (err) {
      console.error("Failed to send chat", err);
    }
  }, []);

  const value = {
    gameData,
    latestSignal,
    chatMessages, // <--- Exported
    isConnected,
    error,
    connect,
    disconnect,
    makeMove,
    sendChatMessage, // <--- Exported
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
