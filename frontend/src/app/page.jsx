"use client";
import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import Head from "next/head";
import Chat from "../components/Chat";
import io from "socket.io-client";
import GameArea from "@/components/gamearea";

const SIGNALING_SERVER =
  process.env.NEXT_PUBLIC_SIGNALING_SERVER || "http://localhost:5000";

const HomePage = () => {
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Check URL params for room ID
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get("room");
    if (roomParam) {
      setRoomId(roomParam);
    }

    // Handle kicked event from sessionStorage (set by Chat component)
    const wasKicked = sessionStorage.getItem("wasKicked");
    if (wasKicked) {
      setError("You were kicked from the room by the leader");
      sessionStorage.removeItem("wasKicked");
    }
  }, []);

  useEffect(() => {
    // Create socket connection when joining a room
    if (joining && roomId && userName) {
      // Initialize socket connection
      const newSocket = io(SIGNALING_SERVER, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Set up socket events
      newSocket.on("connect", () => {
        console.log("Connected to server with ID:", newSocket.id);
        const isLeader = sessionStorage.getItem("isRoomLeader") === "true";
        console.log("Joining room as leader:", isLeader);

        // Join the room
        newSocket.emit("join-room", { roomId, userName, isLeader });

        // Also emit join-chat to ensure chat messages are received
        newSocket.emit("join-chat", { roomId, userName, isLeader });

        // Store the socket in state and ref
        socketRef.current = newSocket;
        setSocket(newSocket);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Connection error:", error);
        setError("Failed to connect to the server. Please try again.");
      });

      // Clean up on unmount
      return () => {
        if (newSocket) {
          console.log("Disconnecting socket");
          newSocket.emit("leave-room", { roomId, userName });
          newSocket.disconnect();
          socketRef.current = null;
          setSocket(null);
        }
      };
    }
  }, [joining, roomId, userName]);

  const handleCreateRoom = () => {
    if (!userName.trim()) {
      setError("Please enter your name first");
      return;
    }
    const newRoomId = uuidv4();
    setRoomId(newRoomId);
    setJoining(true);
    window.history.replaceState({}, "", `?room=${newRoomId}`);

    // When creating a new room, the user is automatically the leader
    sessionStorage.setItem("isRoomLeader", "true");
  };

  const handleJoinRoom = () => {
    if (!userName.trim()) {
      setError("Please enter your name first");
      return;
    }
    if (!roomId.trim()) {
      setError("Please enter a room ID");
      return;
    }
    setError("");
    window.history.replaceState({}, "", `?room=${roomId.trim()}`);

    // When joining an existing room, the user is not the leader
    sessionStorage.removeItem("isRoomLeader");
    setJoining(true);
  };

  const handleLeaveRoom = () => {
    if (window.confirm("Are you sure you want to leave the room?")) {
      if (socketRef.current) {
        socketRef.current.emit("leave-room", { roomId, userName });
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      setJoining(false);
      setRoomId("");
      setUserName("");
      setIsChatOpen(false);
      window.history.replaceState({}, "", "/");
    }
  };

  const handleJoinRandomRoom = async () => {
    if (!userName.trim()) {
      setError("Please enter your name first");
      return;
    }
    setError("");
    const tempSocket = io(SIGNALING_SERVER, {
      transports: ["websocket", "polling"],
    });
    tempSocket.emit("get-random-room", (randomRoomId) => {
      tempSocket.disconnect();
      if (randomRoomId) {
        setRoomId(randomRoomId);

        // When joining a random room, the user is not the leader
        sessionStorage.removeItem("isRoomLeader");
        setJoining(true);
        window.history.replaceState({}, "", `?room=${randomRoomId}`);
      } else {
        setError(
          "No available rooms to join. Try again later or create a new room."
        );
      }
    });
  };

  return (
    <div className="min-h-screen bg-[url(/img/bgimage.png)] p-4 text-white font-sans">
      <Head>
        <title>Draw2win</title>
        <meta
          name="description"
          content="A ftawing game using Next.js, WebRTC, and Socket.IO"
        />
      </Head>
      <img
        className="w-30 mb-5 mx-auto hover:scale-110 transition"
        src="/img/logo1.png"
        alt=""
      />

      {!joining ? (
        <div className="max-w-md mx-auto bg-[#0c2c96bf] p-4 sm:p-8 rounded-sm shadow-md">
          <div className="mb-3">
            <input
              type="text"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-2 border rounded-sm bg-white text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-4">
            <button
              onClick={handleJoinRandomRoom}
              className="w-full bg-[#53e237] text-2xl text-white py-3 rounded-sm hover:opacity-80 transition-colors"
            >
              Play !
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#0c2c96bf] text-white">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-4 py-2 border rounded-sm bg-white text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleJoinRoom}
                className="w-full bg-[#2c8de7] text-2xl text-white py-2 rounded-sm hover:opacity-80 transition-colors"
              >
                Join Room
              </button>
              <button
                onClick={handleCreateRoom}
                className="w-full bg-gray-500 text-xl text-white py-2 rounded-sm hover:opacity-80 transition-colors"
              >
                Create New Room
              </button>
            </div>
          </div>

          {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 relative">
          {/* Game area would go here */}
          <div className="flex-1 bg-white rounded-lg shadow-md p-4 min-h-[400px] md:min-h-[600px]">
            <div className="flex justify-between items-center rounded-lg border-2 border-gray-400 p-3 border-dashed mb-4">
              <h2 className="text-xl text-black font-bold">Room: {roomId}</h2>
              <button
                onClick={handleLeaveRoom}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Leave Room
              </button>
            </div>
            <div className="h-[300px] md:h-[80vh] flex items-center justify-center rounded-lg">
              <GameArea roomId={roomId} userName={userName} socket={socket} />
            </div>
          </div>

          {/* Chat component - now positioned at the extreme right */}
          <div className="md:order-last bg-white rounded-lg text-blue">
            <Chat roomId={roomId} userName={userName} socket={socket} />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
