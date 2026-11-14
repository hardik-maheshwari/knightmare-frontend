import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import apiClient from "../services/apiClient";
import "./VideoChat.css";

const VideoChat = ({ gameId, userId, incomingSignal }) => {
  const [peerId, setPeerId] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const myStreamRef = useRef(null);

  useEffect(() => {
    let peer = null;

    const startVideoChat = async () => {
      try {
        // 1. GET LOCAL STREAM FIRST (Blocking wait)
        // We must have video before we can pick up the phone.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        // Save stream to ref and show it locally
        myStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true; // Always mute local to avoid feedback
        }

        // 2. INITIALIZE PEERJS (After stream is ready)
        // We add STUN servers to punch through routers
        peer = new Peer(undefined, {
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:global.stun.twilio.com:3478" },
            ],
          },
        });

        peer.on("open", (id) => {
          console.log("[VideoChat] My Peer ID is:", id);
          setPeerId(id);
          // Broadcast ID to backend
          apiClient.post(`/api/games/${gameId}/signal/`, {
            type: "video_peer_id",
            payload: id,
          });
        });

        // 3. HANDLE INCOMING CALLS
        peer.on("call", (call) => {
          console.log("[VideoChat] Receiving call...");
          // Answer with our ALREADY READY stream
          call.answer(stream);
          
          call.on("stream", (userVideoStream) => {
            console.log("[VideoChat] Received remote stream");
            setRemoteStream(userVideoStream);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = userVideoStream;
            }
          });
        });

        peerInstance.current = peer;

      } catch (err) {
        console.error("[VideoChat] Error starting video:", err);
      }
    };

    startVideoChat();

    // Cleanup
    return () => {
      if (peer) peer.destroy();
      if (myStreamRef.current) {
        myStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [gameId]); // Only re-run if Game ID changes

  // 4. WATCH FOR SIGNALS (Outgoing Calls)
  useEffect(() => {
    if (!incomingSignal || !peerInstance.current || !myStreamRef.current) return;

    // If opponent sent their ID and it's not me
    if (
      incomingSignal.signal_type === "video_peer_id" &&
      incomingSignal.sender_id !== userId
    ) {
      const opponentPeerId = incomingSignal.payload;
      console.log(`[VideoChat] Calling opponent: ${opponentPeerId}`);

      // Call them with our stream
      const call = peerInstance.current.call(
        opponentPeerId,
        myStreamRef.current
      );

      call.on("stream", (userVideoStream) => {
        console.log("[VideoChat] Remote stream received (Outbound)");
        setRemoteStream(userVideoStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = userVideoStream;
        }
      });
      
      // Handle errors
      call.on("error", (err) => console.error("Call error:", err));
    }
  }, [incomingSignal, userId]);

  const toggleMute = () => {
    if (myStreamRef.current) {
      const audioTrack = myStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (myStreamRef.current) {
      const videoTrack = myStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <div className="video-chat-container">
      <div className="video-grid">
        {/* Remote Video */}
        <div className="video-wrapper remote">
          {/* playsInline is crucial for mobile browsers */}
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="video-element" 
          />
          {!remoteStream && (
            <div className="video-placeholder">Waiting for video...</div>
          )}
        </div>

        {/* Local Video */}
        <div className="video-wrapper local">
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline 
            className="video-element" 
          />
          <div className="local-label">You</div>
        </div>
      </div>

      <div className="video-controls">
        <button
          onClick={toggleVideo}
          className={`control-btn ${isVideoOff ? "off" : ""}`}
        >
          {isVideoOff ? "Show Camera" : "Hide Camera"}
        </button>
        <button
          onClick={toggleMute}
          className={`control-btn ${isMuted ? "off" : ""}`}
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>
      </div>
    </div>
  );
};

export default VideoChat;