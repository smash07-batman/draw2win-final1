"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Users, Crown } from "lucide-react";

const SIGNALING_SERVER =
  process.env.NEXT_PUBLIC_SIGNALING_SERVER || "http://localhost:5000";

// Function to generate random avatar URL
const getRandomAvatar = (name) => {
  const seed = name || Math.random().toString(36).substring(2, 8);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
};

// Function to get initials from name
const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

const Chat = ({ roomId, userName, socket, isMobile }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socketId, setSocketId] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLeader, setIsLeader] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const socketRef = useRef(socket);
  const messagesEndRef = useRef();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    socketRef.current = socket;
    if (!socket) return;

    console.log("Using socket from parent with ID:", socket.id);
    setSocketId(socket.id);

    socket.on("chat-message", (message) => {
      console.log("Received message:", message);
      setMessages((prev) => [...prev, message]);
    });

    socket.on("room-members", (memberList) => {
      console.log("Room members received:", memberList);
      setMembers(memberList);

      const currentUser = memberList.find((m) => m.id === socket.id);
      setIsLeader(currentUser?.isLeader || false);
    });

    socket.on("kicked-from-room", ({ roomId, reason }) => {
      alert(reason);
      sessionStorage.setItem("wasKicked", "true");
      window.location.href = "/";
    });

    return () => {
      if (socket) {
        socket.off("chat-message");
        socket.off("room-members");
        socket.off("kicked-from-room");
      }
    };
  }, [socket, roomId, userName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socketRef.current) {
      const messageData = {
        roomId,
        userName,
        text: newMessage,
        timestamp: new Date().toISOString(),
        socketId: socketRef.current.id,
      };
      socketRef.current.emit("send-message", messageData);
      setNewMessage("");
    }
  };

  const handleKickUser = (userId) => {
    if (isLeader && userId !== socketId && socketRef.current) {
      if (confirm("Are you sure you want to kick this user?")) {
        socketRef.current.emit("kick-user", {
          roomId,
          userToKickId: userId,
        });
      }
    }
  };

  const toggleMembersList = () => {
    setShowMembers(!showMembers);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-indigo-50 rounded-lg flex justify-between items-center">
        <h2 className="text-lg font-semibold text-indigo-700">Chat Room</h2>
        <button
          onClick={toggleMembersList}
          className="p-2 rounded-full hover:bg-indigo-100 transition-colors md:hidden"
          aria-label="Toggle members list"
        >
          <Users size={20} />
        </button>
      </div>

      {/* Mobile members list */}
      {isMobile && showMembers && (
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-md font-semibold mb-2 flex items-center">
            <Users size={16} className="mr-2 " />
            Members ({members.length})
          </h3>
          <ul className="space-y-2">
            {members.map((member) => (
              <li
                key={member.id}
                className={`flex justify-between items-center text-sm py-2 px-2 rounded ${
                  member.id === socketId ? "bg-indigo-50" : ""
                }`}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 text-xs font-medium">
                    {getInitials(member.name)}
                  </div>
                  <div>
                    <div
                      className={
                        member.id === socketId
                          ? "font-bold text-indigo-700"
                          : ""
                      }
                    >
                      {member.id === socketId ? "You" : member.name}
                    </div>
                    {member.isLeader && (
                      <span className="text-xs bg-yellow-500 text-white px-1 py-0.5 rounded-sm flex items-center w-fit mt-0.5">
                        <Crown size={10} className="mr-1" />
                        Leader
                      </span>
                    )}
                  </div>
                </div>
                {isLeader && member.id !== socketId && (
                  <button
                    onClick={() => handleKickUser(member.id)}
                    className="text-xs text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                    title="Kick user"
                  >
                    Kick
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-1 rounded-lg overflow-hidden">
        {/* Desktop members list */}
        <div className="hidden md:block w-64 p-4 bg-white border-r overflow-y-auto">
          <h3 className="text-md text-black font-semibold mb-3 flex items-center">
            <Users size={16} className="mr-2" />
            Members ({members.length})
          </h3>
          <ul className="space-y-2">
            {members.map((member) => (
              <li
                key={member.id}
                className={`flex justify-between items-center text-sm py-2 px-2 rounded ${
                  member.id === socketId ? "bg-indigo-500 text-white" : ""
                }`}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center mr-2 text-xs font-medium">
                    {getInitials(member.name)}
                  </div>
                  <div>
                    <div
                      className={
                        member.id === socketId ? "font-bold" : "text-black"
                      }
                    >
                      {member.id === socketId ? "You" : member.name}
                    </div>
                    {member.isLeader && (
                      <span className="text-xs bg-yellow-500 text-white px-1 py-0.5 rounded-sm flex items-center w-fit mt-0.5">
                        <Crown size={10} className="mr-1" />
                        Leader
                      </span>
                    )}
                  </div>
                </div>
                {isLeader && member.id !== socketId && (
                  <button
                    onClick={() => handleKickUser(member.id)}
                    className="text-xs text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                    title="Kick user"
                  >
                    Kick
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Chat section */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Messages area with fixed height */}
          <div className="p-4 overflow-y-auto h-[80vh]">
            {messages.length === 0 ? (
              <div className="text-center text-black mt-4">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-3 ${
                    msg.socketId === socketId ? "ml-auto" : ""
                  }`}
                >
                  <div className="font-semibold text-xs sm:text-sm text-black">
                    {msg.socketId === socketId ? "You" : msg.userName}
                  </div>
                  <div
                    className={`rounded-lg p-2 mt-1 text-sm max-w-[80%] ${
                      msg.socketId === socketId
                        ? "bg-indigo-500 text-white ml-auto"
                        : "bg-gray-500 text-white"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input box */}
          <form onSubmit={sendMessage} className="p-3 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 text-sm border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
