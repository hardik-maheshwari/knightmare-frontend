import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import apiClient from "../services/apiClient";
import "./VideoChat.css";

const VideoChat = ({ gameId, userId, incomingSignal }) => {
  const [myPeerId, setMyPeerId] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const myStreamRef = useRef(null);

  // 1. Initialize PeerJS & Local Camera
  useEffect(() => {
    const peer = new Peer(); // Auto-generates an ID from PeerJS Cloud

    peer.on("open", (id) => {
      console.log("[VideoChat] My Peer ID is:", id);
      setMyPeerId(id);
      // Broadcast my ID to the opponent via our Backend
      apiClient.post(`/api/games/${gameId}/signal/`, {
        type: "video_peer_id",
        payload: id,
      });
    });

    peer.on("call", (call) => {
      console.log("[VideoChat] Receiving call...");
      // Answer the call with our local stream
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          // Show local video
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
          myStreamRef.current = stream;

          call.answer(stream); // Answer call
          call.on("stream", (userVideoStream) => {
             // Show remote video
            setRemoteStream(userVideoStream);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = userVideoStream;
          });
        });
    });

    peerInstance.current = peer;

    // Get local media immediately for setup
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        myStreamRef.current = stream;
      })
      .catch((err) => console.error("Failed to get local stream", err));

    return () => {
      if (peer) peer.destroy();
      if (myStreamRef.current) {
        myStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [gameId]);

  // 2. Watch for signals from the backend (Opponent's Peer ID)
  useEffect(() => {
    if (!incomingSignal) return;
    
    // If the signal is a video ID and it's NOT mine
    if (incomingSignal.signal_type === "video_peer_id" && incomingSignal.sender_id !== userId) {
      const opponentPeerId = incomingSignal.payload;
      console.log(`[VideoChat] Found opponent PeerID: ${opponentPeerId}. Calling...`);
      
      // Call them!
      if (peerInstance.current && myStreamRef.current) {
        const call = peerInstance.current.call(opponentPeerId, myStreamRef.current);
        call.on("stream", (userVideoStream) => {
          setRemoteStream(userVideoStream);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = userVideoStream;
        });
      }
    }
  }, [incomingSignal, userId]);

  const toggleMute = () => {
    if (myStreamRef.current) {
      myStreamRef.current.getAudioTracks()[0].enabled = !myStreamRef.current.getAudioTracks()[0].enabled;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (myStreamRef.current) {
      myStreamRef.current.getVideoTracks()[0].enabled = !myStreamRef.current.getVideoTracks()[0].enabled;
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="video-chat-container">
      <div className="video-grid">
        {/* Opponent Video */}
        <div className="video-wrapper remote">
          <video ref={remoteVideoRef} autoPlay className="video-element" />
          {!remoteStream && <div className="video-placeholder">Waiting for opponent...</div>}
        </div>

        {/* My Video (Muted locally to prevent echo) */}
        <div className="video-wrapper local">
          <video ref={localVideoRef} autoPlay muted className="video-element" />
          <div className="local-label">You</div>
        </div>
      </div>

      <div className="video-controls">
        <button onClick={toggleVideo} className={`control-btn ${isVideoOff ? "off" : ""}`}>
          {isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
        </button>
        <button onClick={toggleMute} className={`control-btn ${isMuted ? "off" : ""}`}>
          {isMuted ? "Unmute" : "Mute"}
        </button>
      </div>
    </div>
  );
};

export default VideoChat;