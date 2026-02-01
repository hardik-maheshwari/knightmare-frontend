import React, { useState, useEffect, useRef } from "react";
import "./ChessClock.css";

const formatTime = (ms) => {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const ChessClock = ({ 
  currentMs,      // Time remaining in bank (from DB snapshot)
  isTurn,         // Is it ticking?
  lastMoveAt,     // Timestamp of last move
  onTimeout 
}) => {
  const [displayTime, setDisplayTime] = useState(currentMs);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Helper function to calculate exact remaining time based on System Clock
    const getExactTime = () => {
      // If it's not our turn, time is paused at the value from DB
      if (!isTurn || !lastMoveAt) return currentMs;

      const now = Date.now();
      const lastMoveTime = new Date(lastMoveAt).getTime();
      
      // Real elapsed time regardless of browser lag/throttling
      const elapsed = now - lastMoveTime;
      
      return Math.max(0, currentMs - elapsed);
    };

    // 1. Update immediately on prop change (e.g. new move arrived)
    setDisplayTime(getExactTime());

    // Clear previous interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    // 2. Start Ticking
    if (isTurn) {
      intervalRef.current = setInterval(() => {
        // RECALCULATE from scratch every tick. 
        // Do not rely on 'prev' state.
        const exactTime = getExactTime();
        
        setDisplayTime(exactTime);

        if (exactTime <= 0) {
          clearInterval(intervalRef.current);
          if (onTimeout) onTimeout();
        }
      }, 100);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentMs, isTurn, lastMoveAt, onTimeout]);

  const isLowTime = displayTime < 30000;

  return (
    <div className={`chess-clock ${isTurn ? "active" : ""} ${isLowTime ? "low-time" : ""}`}>
      {formatTime(displayTime)}
    </div>
  );
};

export default ChessClock;