import React, { useState, useRef, useEffect } from "react";
import { useGameSocket } from "../context/GameSocket";
import { useAuth } from "../hooks/useAuth";
import "./ChatPanel.css";

const ChatPanel = ({ gameId }) => {
  const [input, setInput] = useState("");
  const { chatMessages, sendChatMessage } = useGameSocket();
  const { user } = useAuth();
  
  // Ref for auto-scrolling to bottom
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever chatMessages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Send logic
    const content = input.trim();
    setInput(""); // Optimistic clear
    await sendChatMessage(gameId, content);
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>Game Chat</h3>
      </div>

      <div className="chat-messages">
        {chatMessages.length === 0 && (
          <div className="chat-empty">No messages yet. GLHF!</div>
        )}
        
        {chatMessages.map((msg, index) => {
          // Check if I sent this message
          const isMe = msg.sender_username === user.username;
          
          return (
            <div
              key={msg.message_id || index} // Fallback to index if ID missing
              className={`chat-bubble-row ${isMe ? "me" : "other"}`}
            >
              {!isMe && (
                <span className="chat-sender">{msg.sender_username}</span>
              )}
              <div className="chat-bubble">{msg.content}</div>
            </div>
          );
        })}
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          maxLength={500}
        />
        <button type="submit" disabled={!input.trim()}>
          ➤
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;